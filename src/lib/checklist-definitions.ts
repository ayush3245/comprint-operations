import { DeviceCategory } from '@prisma/client'

export interface ChecklistItemDefinition {
  index: number
  text: string
  // Notes field placeholder pattern (e.g., "___%" for battery, "___GB" for storage)
  notesPlaceholder?: string
}

/**
 * Category-specific inspection checklist items.
 * Each item has an index (for ordering) and the checklist text.
 * Based on docs/Refurbished_Device_Inspection_Checklist.md
 */
export const CHECKLIST_DEFINITIONS: Record<DeviceCategory, ChecklistItemDefinition[]> = {
  LAPTOP: [
    { index: 1, text: 'LCD screen free from cracks, scratches, and physical damage' },
    { index: 2, text: 'Dead pixel test: 0 dead/stuck pixels found' },
    { index: 3, text: 'Screen brightness and color uniformity acceptable' },
    { index: 4, text: 'Keyboard: All keys present, functional, no sticking' },
    { index: 5, text: 'Touchpad responsive, buttons functional, no cracks' },
    { index: 6, text: 'Lid/cover: Hinges operate smoothly, no excessive wobble' },
    { index: 7, text: 'Case condition: No major dents, cracks, or warping' },
    { index: 8, text: 'Battery health check (minimum 70% acceptable)', notesPlaceholder: '___% capacity' },
    { index: 9, text: 'All USB ports tested and functional', notesPlaceholder: 'count: ___' },
    { index: 10, text: 'HDMI/DisplayPort output tested successfully' },
    { index: 11, text: 'Audio jack and speakers tested, both channels work' },
    { index: 12, text: 'Ethernet port tested and functional' },
    { index: 13, text: 'Charging port secure, charges properly' },
    { index: 14, text: 'WiFi connects successfully, signal strength good' },
    { index: 15, text: 'Bluetooth tested and pairs correctly' },
    { index: 16, text: 'Webcam and microphone tested, quality acceptable' },
    { index: 17, text: 'BIOS accessible, no password protection' },
    { index: 18, text: 'CPU, RAM, Storage verified', notesPlaceholder: 'CPU: ___, RAM: ___GB, Storage: ___GB' },
    { index: 19, text: 'Burn-in test completed: no errors/crashes', notesPlaceholder: '___hours' },
    { index: 20, text: 'Temperature readings normal, fans operate correctly' },
  ],

  DESKTOP: [
    { index: 1, text: 'Case exterior: No major dents, cracks, or damage' },
    { index: 2, text: 'Front panel buttons functional (power, reset)' },
    { index: 3, text: 'Side panels fit properly and secure' },
    { index: 4, text: 'Motherboard visually inspected: No bulging capacitors' },
    { index: 5, text: 'CPU heatsink properly mounted, thermal paste acceptable' },
    { index: 6, text: 'RAM modules properly seated', notesPlaceholder: '___GB total detected' },
    { index: 7, text: 'Storage drives properly installed and secure' },
    { index: 8, text: 'GPU properly seated in PCIe slot (if present)' },
    { index: 9, text: 'All power cables properly connected (24-pin, CPU, PCIe)' },
    { index: 10, text: 'Cable management adequate, no loose cables' },
    { index: 11, text: 'All case fans present and operational' },
    { index: 12, text: 'Front and rear USB ports tested', notesPlaceholder: 'count: ___' },
    { index: 13, text: 'Audio ports (front and rear) tested successfully' },
    { index: 14, text: 'Video outputs tested (HDMI, DP, VGA, DVI)' },
    { index: 15, text: 'Ethernet port tested and functional' },
    { index: 16, text: 'POST successful, all components detected in BIOS' },
    { index: 17, text: 'Storage drives detected, SMART status healthy' },
    { index: 18, text: 'System boots successfully, stable operation' },
    { index: 19, text: 'CPU and GPU stress test: temps acceptable', notesPlaceholder: '___hours' },
    { index: 20, text: 'No unusual noises (grinding, clicking, excessive fan noise)' },
  ],

  WORKSTATION: [
    { index: 1, text: 'Case exterior: No major dents, cracks, or damage' },
    { index: 2, text: 'Front panel buttons functional (power, reset)' },
    { index: 3, text: 'Side panels fit properly and secure' },
    { index: 4, text: 'Motherboard visually inspected: No bulging capacitors' },
    { index: 5, text: 'CPU heatsink properly mounted, thermal paste acceptable' },
    { index: 6, text: 'RAM modules properly seated', notesPlaceholder: '___GB total detected' },
    { index: 7, text: 'Storage drives properly installed and secure' },
    { index: 8, text: 'GPU properly seated in PCIe slot (if present)' },
    { index: 9, text: 'All power cables properly connected (24-pin, CPU, PCIe)' },
    { index: 10, text: 'Cable management adequate, no loose cables' },
    { index: 11, text: 'All case fans present and operational' },
    { index: 12, text: 'Front and rear USB ports tested', notesPlaceholder: 'count: ___' },
    { index: 13, text: 'Audio ports (front and rear) tested successfully' },
    { index: 14, text: 'Video outputs tested (HDMI, DP, VGA, DVI)' },
    { index: 15, text: 'Ethernet port tested and functional' },
    { index: 16, text: 'POST successful, all components detected in BIOS' },
    { index: 17, text: 'Storage drives detected, SMART status healthy' },
    { index: 18, text: 'System boots successfully, stable operation' },
    { index: 19, text: 'CPU and GPU stress test: temps acceptable', notesPlaceholder: '___hours' },
    { index: 20, text: 'No unusual noises (grinding, clicking, excessive fan noise)' },
  ],

  SERVER: [
    { index: 1, text: 'Rack mounting hardware intact and complete' },
    { index: 2, text: 'Chassis physically sound, no structural damage' },
    { index: 3, text: 'Drive bay trays/caddies present', notesPlaceholder: 'count: ___' },
    { index: 4, text: 'Front LCD/LED panel functional (if present)' },
    { index: 5, text: 'CPU configuration verified', notesPlaceholder: '___x CPUs' },
    { index: 6, text: 'RAM capacity verified', notesPlaceholder: '___GB properly detected' },
    { index: 7, text: 'RAID controller present and detected' },
    { index: 8, text: 'Network interface cards detected', notesPlaceholder: '___x ports detected' },
    { index: 9, text: 'Management controller (iDRAC/iLO/BMC) accessible' },
    { index: 10, text: 'Remote console/KVM functionality verified' },
    { index: 11, text: 'All installed drives detected in BIOS/RAID controller' },
    { index: 12, text: 'SMART status checked: All drives healthy' },
    { index: 13, text: 'Hot-swap functionality tested on drive bays' },
    { index: 14, text: 'Network ports tested: Link established, speed verified' },
    { index: 15, text: 'Redundant power supplies: Both functional (if applicable)' },
    { index: 16, text: 'Power supply failover tested successfully' },
    { index: 17, text: 'All cooling fans operational, speeds normal' },
    { index: 18, text: 'Temperature sensors reading correctly' },
    { index: 19, text: 'System stress test: no errors logged', notesPlaceholder: '___hours' },
    { index: 20, text: 'Firmware versions documented, no critical updates needed' },
  ],

  MONITOR: [
    { index: 1, text: 'Screen free from cracks, scratches, or physical damage' },
    { index: 2, text: 'Dead pixel test: 0 dead/stuck pixels confirmed' },
    { index: 3, text: 'Screen uniformity test: No bright spots or dark areas' },
    { index: 4, text: 'Backlight bleeding: Minimal/acceptable levels' },
    { index: 5, text: 'Color reproduction accurate across full spectrum' },
    { index: 6, text: 'Bezel intact, no cracks or missing pieces' },
    { index: 7, text: 'Stand/base stable, no wobbling' },
    { index: 8, text: 'HDMI input(s) tested', notesPlaceholder: 'count: ___' },
    { index: 9, text: 'DisplayPort input(s) tested', notesPlaceholder: 'count: ___' },
    { index: 10, text: 'VGA/DVI inputs tested (if present)' },
    { index: 11, text: 'OSD menu accessible, all buttons functional' },
    { index: 12, text: 'Brightness and contrast adjustments work properly' },
    { index: 13, text: 'Stand adjustments functional: Tilt, height, swivel (as applicable)' },
    { index: 14, text: 'Built-in speakers tested (if present)' },
    { index: 15, text: 'USB hub ports tested (if present)' },
    { index: 16, text: 'Native resolution verified', notesPlaceholder: '___x___ at ___Hz' },
    { index: 17, text: 'No image ghosting or trailing in motion test' },
    { index: 18, text: 'No flickering at any brightness level' },
    { index: 19, text: 'Extended burn-in test: no image retention', notesPlaceholder: '___hours' },
    { index: 20, text: 'Power cable and adapter included (if external)' },
  ],

  STORAGE: [
    { index: 1, text: 'Physical condition: Casing intact, no damage or corrosion' },
    { index: 2, text: 'Connector pins straight and undamaged' },
    { index: 3, text: 'Label intact and readable, model/serial verified' },
    { index: 4, text: 'No rattling sounds when shaken gently (HDD only)' },
    { index: 5, text: 'Device detected by system correctly' },
    { index: 6, text: 'Reported capacity matches specifications' },
    { index: 7, text: 'Interface speed correct (SATA 3Gbps/6Gbps, PCIe Gen)' },
    { index: 8, text: 'SMART status: Overall health PASSED' },
    { index: 9, text: 'SMART: Reallocated sectors count', notesPlaceholder: 'count: ___' },
    { index: 10, text: 'SMART: Current pending sectors', notesPlaceholder: 'count: ___' },
    { index: 11, text: 'SMART: Uncorrectable errors', notesPlaceholder: 'count: ___' },
    { index: 12, text: 'Power-on hours and power cycle count documented', notesPlaceholder: 'POH: ___, Cycles: ___' },
    { index: 13, text: 'Sequential read speed meets specification', notesPlaceholder: '___MB/s' },
    { index: 14, text: 'Sequential write speed meets specification', notesPlaceholder: '___MB/s' },
    { index: 15, text: 'Surface scan completed: 0 bad sectors found' },
    { index: 16, text: 'Temperature during operation acceptable', notesPlaceholder: '___°C' },
    { index: 17, text: 'Data sanitization completed: Secure erase/wipe verified' },
    { index: 18, text: 'No recoverable data remaining on device' },
    { index: 19, text: 'Extended stress test: no errors', notesPlaceholder: '___hours' },
    { index: 20, text: 'Mounting hardware/adapter included (if applicable)' },
  ],

  NETWORKING_CARD: [
    { index: 1, text: 'PCB condition: Clean, no cracks, burns, or damage' },
    { index: 2, text: 'No bulging or leaking capacitors' },
    { index: 3, text: 'PCIe connector edge clean and undamaged' },
    { index: 4, text: 'Mounting bracket secure and straight' },
    { index: 5, text: 'All port connectors physically intact' },
    { index: 6, text: 'Heatsink properly attached (if present)' },
    { index: 7, text: 'Card properly seated in PCIe slot' },
    { index: 8, text: 'Detected correctly by system BIOS and OS' },
    { index: 9, text: 'Driver installation successful, no errors' },
    { index: 10, text: 'MAC address(es) readable and documented' },
    { index: 11, text: 'All ports tested individually' },
    { index: 12, text: 'Link established at correct speed', notesPlaceholder: '___Gbps' },
    { index: 13, text: 'Auto-negotiation and duplex mode correct' },
    { index: 14, text: 'LED indicators (link, activity) functional' },
    { index: 15, text: 'Throughput test: achieved with 0% packet loss', notesPlaceholder: '___Gbps' },
    { index: 16, text: 'Latency acceptable, no connection drops' },
    { index: 17, text: 'Advanced features tested (if applicable): VLAN, offload, SR-IOV' },
    { index: 18, text: 'Stress test: stable at full load', notesPlaceholder: '___hours' },
    { index: 19, text: 'Temperature acceptable under load' },
    { index: 20, text: 'Low-profile bracket included (if applicable)' },
  ],
}

/**
 * Get checklist items for a specific device category
 */
export function getChecklistForCategory(category: DeviceCategory): ChecklistItemDefinition[] {
  return CHECKLIST_DEFINITIONS[category] || []
}

/**
 * Get the total number of checklist items for a category
 */
export function getChecklistItemCount(category: DeviceCategory): number {
  return CHECKLIST_DEFINITIONS[category]?.length || 0
}
