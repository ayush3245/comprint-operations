'use server'

// Types for verification
export interface DeviceData {
  barcode: string
  category: string
  brand: string
  model: string
  serial?: string | null
  specifications?: Record<string, string | null>
}

export interface ExpectedItem {
  category: string
  brand: string
  model: string
  serial?: string | null
  quantity: number
  specifications?: Record<string, unknown> | null
}

export interface PurchaseOrderData {
  poNumber: string
  supplierCode: string
  expectedDevices: number
  expectedItems: ExpectedItem[]
}

export interface VerificationResult {
  success: boolean
  status: 'VERIFIED' | 'PARTIAL'
  matchPercentage: number
  matched: MatchedItem[]
  missing: ExpectedItem[]
  extra: DeviceData[]
  discrepancies: Discrepancy[]
  rawResponse?: string
  error?: string
}

export interface MatchedItem {
  expected: ExpectedItem
  received: DeviceData
}

export interface Discrepancy {
  type: 'MISMATCH' | 'QUANTITY' | 'SERIAL'
  description: string
  expected?: string
  received?: string
}

const VERIFICATION_PROMPT = `You are a shipment verification assistant for a refurbished electronics company. Your task is to compare received devices against a purchase order to verify the shipment.

IMPORTANT: You must respond with ONLY valid JSON, no markdown, no explanations.

Compare the devices carefully:
1. Match by category first (LAPTOP, DESKTOP, SERVER, MONITOR, etc.)
2. Then match by brand (case-insensitive)
3. Then match by model (partial matching allowed)
4. Serial numbers are optional - use for additional verification if available
5. Count quantities for each unique item

Respond with this exact JSON structure:
{
  "status": "VERIFIED" or "PARTIAL",
  "matchPercentage": <number 0-100>,
  "matched": [{"expected": {...}, "received": {...}}],
  "missing": [<expected items not received>],
  "extra": [<received items not in order>],
  "discrepancies": [{"type": "MISMATCH|QUANTITY|SERIAL", "description": "...", "expected": "...", "received": "..."}]
}

Rules:
- VERIFIED: matchPercentage >= 90
- PARTIAL: matchPercentage < 90
- matchPercentage = (matched items / total expected items) * 100`

function formatVerificationData(devices: DeviceData[], purchaseOrder: PurchaseOrderData): string {
  const expectedSection = purchaseOrder.expectedItems.map((item, i) =>
    `${i + 1}. Category: ${item.category}, Brand: ${item.brand}, Model: ${item.model}, Qty: ${item.quantity}${item.serial ? `, Serial: ${item.serial}` : ''}`
  ).join('\n')

  const receivedSection = devices.map((d, i) =>
    `${i + 1}. Barcode: ${d.barcode}, Category: ${d.category}, Brand: ${d.brand}, Model: ${d.model}${d.serial ? `, Serial: ${d.serial}` : ''}`
  ).join('\n')

  return `PURCHASE ORDER: ${purchaseOrder.poNumber}
Supplier: ${purchaseOrder.supplierCode}
Expected Device Count: ${purchaseOrder.expectedDevices}

EXPECTED ITEMS:
${expectedSection}

RECEIVED DEVICES (${devices.length} total):
${receivedSection}

Analyze and provide verification result as JSON only.`
}

export async function verifyShipment(
  devices: DeviceData[],
  purchaseOrder: PurchaseOrderData
): Promise<VerificationResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OpenRouter not configured. Set OPENROUTER_API_KEY environment variable.')
    return {
      success: false,
      status: 'PARTIAL',
      matchPercentage: 0,
      matched: [],
      missing: purchaseOrder.expectedItems,
      extra: devices,
      discrepancies: [],
      error: 'OpenRouter API key not configured'
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Comprint Operations - Shipment Verification'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          { role: 'system', content: VERIFICATION_PROMPT },
          { role: 'user', content: formatVerificationData(devices, purchaseOrder) }
        ],
        temperature: 0.1, // Low temperature for consistent, deterministic responses
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return {
        success: false,
        status: 'PARTIAL',
        matchPercentage: 0,
        matched: [],
        missing: purchaseOrder.expectedItems,
        extra: devices,
        discrepancies: [],
        error: `API error: ${response.status}`
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return {
        success: false,
        status: 'PARTIAL',
        matchPercentage: 0,
        matched: [],
        missing: purchaseOrder.expectedItems,
        extra: devices,
        discrepancies: [],
        error: 'No response from LLM'
      }
    }

    // Parse the JSON response
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }

      const result = JSON.parse(jsonStr.trim())

      return {
        success: true,
        status: result.status || 'PARTIAL',
        matchPercentage: result.matchPercentage || 0,
        matched: result.matched || [],
        missing: result.missing || [],
        extra: result.extra || [],
        discrepancies: result.discrepancies || [],
        rawResponse: content
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError, content)
      return {
        success: false,
        status: 'PARTIAL',
        matchPercentage: 0,
        matched: [],
        missing: purchaseOrder.expectedItems,
        extra: devices,
        discrepancies: [],
        error: 'Failed to parse LLM response',
        rawResponse: content
      }
    }
  } catch (error) {
    console.error('Verification error:', error)
    return {
      success: false,
      status: 'PARTIAL',
      matchPercentage: 0,
      matched: [],
      missing: purchaseOrder.expectedItems,
      extra: devices,
      discrepancies: [],
      error: error instanceof Error ? error.message : 'Verification failed'
    }
  }
}

export async function isOpenRouterConfigured(): Promise<boolean> {
  return !!process.env.OPENROUTER_API_KEY
}
