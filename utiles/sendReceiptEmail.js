const nodemailer = require('nodemailer')

// Lightweight receipt email helper
// inputs: { to, customerName, orderId, total, shippingInfo, items }
module.exports = async function sendReceiptEmail({ to, customerName, orderId, total, shippingInfo = {}, items = [] }) {
    try {
        const host = process.env.MAIL_HOST || 'smtp.mailtrap.io'
        const port = Number(process.env.MAIL_PORT || 2525)
        const user = process.env.MAIL_USER
        const pass = process.env.MAIL_PASS

        if (!user || !pass) {
            console.log('Receipt email skipped: MAIL_USER or MAIL_PASS not configured')
            return
        }

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: false,
            auth: { user, pass }
        })

        const shippingBlock = `
            <div style="font-size:14px; line-height:1.5; color:#111;">
                <div><strong>Name:</strong> ${shippingInfo.name || customerName || ''}</div>
                <div><strong>Phone:</strong> ${shippingInfo.phone || ''}</div>
                <div><strong>Address:</strong> ${shippingInfo.address || ''}</div>
                <div><strong>City/Area:</strong> ${[shippingInfo.city, shippingInfo.area].filter(Boolean).join(', ')}</div>
                <div><strong>Province/Postal:</strong> ${[shippingInfo.province, shippingInfo.post].filter(Boolean).join(', ')}</div>
            </div>
        `

        const itemsRows = items.map((item) => {
            const title = item.name || item.productName || item.slug || 'Item'
            const qty = item.quantity || 1
            const price = item.price || item.discountPrice || item.salePrice || 0
            const lineTotal = (qty * price).toFixed(2)
            return `
                <tr>
                    <td style="padding:8px 12px; border:1px solid #eee;">${title}</td>
                    <td style="padding:8px 12px; border:1px solid #eee; text-align:center;">${qty}</td>
                    <td style="padding:8px 12px; border:1px solid #eee; text-align:right;">NPR ${price}</td>
                    <td style="padding:8px 12px; border:1px solid #eee; text-align:right;">NPR ${lineTotal}</td>
                </tr>
            `
        }).join('') || `<tr><td colspan="4" style="padding:12px; border:1px solid #eee; text-align:center; color:#666;">No items found</td></tr>`

        const html = `
            <div style="font-family:Arial,sans-serif; max-width:640px; margin:0 auto; color:#111;">
                <h2 style="color:#0f766e;">Thank you for your purchase!</h2>
                <p style="font-size:14px;">Your payment was received successfully.</p>

                <div style="margin:16px 0; padding:12px; background:#f8fafc; border:1px solid #e2e8f0;">
                    <div><strong>Order ID:</strong> ${orderId}</div>
                    <div><strong>Total Paid:</strong> NPR ${(total || 0).toFixed(2)}</div>
                </div>

                <h3 style="margin:12px 0 6px;">Delivery Address</h3>
                ${shippingBlock}

                <h3 style="margin:16px 0 6px;">Items</h3>
                <table style="border-collapse:collapse; width:100%; font-size:14px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="padding:8px 12px; border:1px solid #eee; text-align:left;">Product</th>
                            <th style="padding:8px 12px; border:1px solid #eee; text-align:center;">Qty</th>
                            <th style="padding:8px 12px; border:1px solid #eee; text-align:right;">Price</th>
                            <th style="padding:8px 12px; border:1px solid #eee; text-align:right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div style="margin:20px 0; text-align:center;">
                    <a href="http://localhost:3000/order/track/${orderId}" style="display:inline-block; background:#0f766e; color:#fff; text-decoration:none; padding:12px 30px; border-radius:5px; font-weight:bold; font-size:16px;">
                        🚚 Track Your Order
                    </a>
                </div>

                <p style="margin-top:16px; font-size:13px; color:#555;">If you have questions, reply to this email.</p>
            </div>
        `

        const info = await transporter.sendMail({
            from: 'Easy Shop <noreply@easyshop.com>',
            to,
            subject: `Your receipt for order ${orderId}`,
            html
        })
        console.log('Receipt email sent:', { to, orderId, messageId: info.messageId })
    } catch (err) {
        console.log('Receipt email send error:', err.message)
    }
}
