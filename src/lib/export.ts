/**
 * CSV Export Utilities
 * Provides functions for exporting data to CSV format
 */

interface ExportColumn<T> {
  key: keyof T | string
  header: string
  formatter?: (value: any, row: T) => string
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = 'export'
): void {
  if (data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Generate headers
  const headers = columns.map(col => col.header)

  // Generate rows
  const rows = data.map(item => {
    return columns.map(col => {
      const key = col.key as string
      const value = key.includes('.')
        ? getNestedValue(item, key)
        : item[key]

      if (col.formatter) {
        return escapeCSV(col.formatter(value, item))
      }

      return escapeCSV(formatValue(value))
    })
  })

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create and trigger download
  downloadCSV(csvContent, filename)
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Format value for CSV
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Trigger CSV download
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  // Add date to filename
  const date = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}-${date}.csv`

  link.href = url
  link.download = fullFilename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up URL
  URL.revokeObjectURL(url)
}

/**
 * Pre-configured export for inventory devices
 */
export function exportInventoryToCSV(devices: any[]): void {
  const columns: ExportColumn<any>[] = [
    { key: 'barcode', header: 'Barcode' },
    { key: 'serialNumber', header: 'Serial Number' },
    { key: 'brand', header: 'Brand' },
    { key: 'model', header: 'Model' },
    { key: 'category', header: 'Category' },
    { key: 'status', header: 'Status', formatter: (v) => v?.replace(/_/g, ' ') || '' },
    { key: 'grade', header: 'Grade' },
    { key: 'ownershipType', header: 'Ownership Type' },
    { key: 'location', header: 'Location' },
    { key: 'createdAt', header: 'Created At', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { key: 'updatedAt', header: 'Last Updated', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
  ]

  exportToCSV(devices, columns, 'inventory')
}

/**
 * Pre-configured export for repair jobs
 */
export function exportRepairJobsToCSV(jobs: any[]): void {
  const columns: ExportColumn<any>[] = [
    { key: 'device.barcode', header: 'Barcode' },
    { key: 'device.brand', header: 'Brand' },
    { key: 'device.model', header: 'Model' },
    { key: 'status', header: 'Status', formatter: (v) => v?.replace(/_/g, ' ') || '' },
    { key: 'reportedIssues', header: 'Reported Issues' },
    { key: 'sparesRequired', header: 'Spares Required' },
    { key: 'sparesIssued', header: 'Spares Issued' },
    { key: 'repairStartDate', header: 'Start Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { key: 'repairEndDate', header: 'End Date', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { key: 'l2Engineer.name', header: 'L2 Engineer' },
  ]

  exportToCSV(jobs, columns, 'repair-jobs')
}

/**
 * Pre-configured export for QC records
 */
export function exportQCRecordsToCSV(records: any[]): void {
  const columns: ExportColumn<any>[] = [
    { key: 'device.barcode', header: 'Barcode' },
    { key: 'device.brand', header: 'Brand' },
    { key: 'device.model', header: 'Model' },
    { key: 'status', header: 'QC Status' },
    { key: 'finalGrade', header: 'Final Grade' },
    { key: 'completedAt', header: 'Completed At', formatter: (v) => v ? new Date(v).toLocaleDateString() : '' },
    { key: 'qcEng.name', header: 'QC Engineer' },
    { key: 'notes', header: 'Notes' },
  ]

  exportToCSV(records, columns, 'qc-records')
}
