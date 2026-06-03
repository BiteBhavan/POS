import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import net from 'net'

export async function POST(req: Request) {
  const supabase = createClient()
  const body = await req.json()
  const { type, orderId } = body

  const { data: settings } = await supabase.from('app_settings').select('printer_ip,printer_port,business_name').single()
  if (!settings?.printer_ip) return NextResponse.json({ error: 'Printer not configured' }, { status: 400 })

  let content = ''
  if (type === 'test') {
    content = [
      '\x1b\x40',          // Init
      '\x1b\x61\x01',    // Center
      '\x1b\x21\x10',    // Bold
      `${settings.business_name}\n`,
      '\x1b\x21\x00',    // Normal
      '--- Test Print ---\n',
      `${new Date().toLocaleString('en-IN')}\n`,
      '\n\n\n',
      '\x1d\x56\x00',    // Cut
    ].join('')
  } else if (type === 'kot' && orderId) {
    const { data: order } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    content = [
      '\x1b\x40',
      '\x1b\x61\x01',
      '\x1b\x21\x10',
      `${settings.business_name}\n`,
      '\x1b\x21\x00',
      `KOT #BB-${String(order.order_number).padStart(4,'0')}\n`,
      `${new Date(order.created_at).toLocaleTimeString('en-IN')}\n`,
      order.address_short_code ? `Address: ${order.address_short_code}\n` : '',
      order.address_note ? `${order.address_note}\n` : '',
      '------------------------\n',
      ...order.order_items.map((i: any) => `${i.quantity}x ${i.item_name}${i.note ? ` [${i.note}]` : ''}\n`),
      '------------------------\n',
      `Source: ${order.source.toUpperCase()}\n`,
      '\n\n\n',
      '\x1d\x56\x00',
    ].join('')
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const client = net.createConnection({ host: settings.printer_ip!, port: settings.printer_port ?? 9100 }, () => {
        client.write(Buffer.from(content, 'binary'), () => { client.end(); resolve() })
      })
      client.on('error', reject)
      setTimeout(() => { client.destroy(); reject(new Error('Timeout')) }, 5000)
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
