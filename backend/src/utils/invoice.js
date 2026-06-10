const PDFDocument = require('pdfkit');

const generateInvoice = (order, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Invoice #${order.invoice_number || order.id}`,
                    Author: 'Axom Dana LLC',
                },
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Colors
            const primaryColor = '#1a8a3f';
            const secondaryColor = '#666666';
            const lightGray = '#f5f5f5';
            const borderColor = '#e0e0e0';

            // ── Header ──
            doc.fontSize(28).font('Helvetica-Bold').fillColor(primaryColor)
                .text('AXOM DANA LLC', 50, 50);

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text('Beharbari, Guwahati, Assam, India', 50, 85)
                .text('Email: info@axomdana.in', 50, 100)
                .text('GST: 18AABCU9603R1ZP', 50, 115);

            // Invoice title (right aligned)
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#333')
                .text('TAX INVOICE', 400, 50, { align: 'right' });

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text(`Invoice #: ${order.invoice_number || 'INV-' + order.id.toString().padStart(6, '0')}`, 400, 80, { align: 'right' })
                .text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 400, 95, { align: 'right' })
                .text(`Order ID: #${order.id}`, 400, 110, { align: 'right' });

            // Separator line
            doc.moveTo(50, 140).lineTo(545, 140).strokeColor(borderColor).stroke();

            // ── Bill To ──
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#333')
                .text('Bill To:', 50, 160);

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text(user.name || 'Customer', 50, 178)
                .text(`Email: ${order.email || user.email || 'N/A'}`, 50, 194)
                .text(`Phone: ${order.phone || 'N/A'}`, 50, 210)
                .text(`Address: ${order.shipping_address}`, 50, 226);

            // ── Payment Info ──
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#333')
                .text('Payment Info:', 320, 160);

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text(`Method: ${(order.payment_method || 'UPI').toUpperCase()}`, 320, 178)
                .text(`Status: ${(order.payment_status || 'Pending').charAt(0).toUpperCase() + (order.payment_status || 'Pending').slice(1)}`, 320, 194)
                .text(`Transaction ID: ${order.upi_transaction_id || 'N/A'}`, 320, 210);

            // Separator line
            doc.moveTo(50, 255).lineTo(545, 255).strokeColor(borderColor).stroke();

            // ── Items Table Header ──
            const tableTop = 275;
            const col1 = 50;   // Item
            const col2 = 320;  // Qty
            const col3 = 390;  // Rate
            const col4 = 470;  // Amount

            doc.rect(50, tableTop - 8, 495, 28).fill(lightGray);

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333')
                .text('Item', col1 + 10, tableTop)
                .text('Qty', col2, tableTop, { width: 60, align: 'center' })
                .text('Rate', col3, tableTop, { width: 70, align: 'right' })
                .text('Amount', col4, tableTop, { width: 70, align: 'right' });

            // ── Items ──
            let y = tableTop + 30;
            let total = 0;

            if (order.items && order.items.length > 0) {
                order.items.forEach((item, i) => {
                    const amount = parseFloat(item.price) * item.quantity;
                    total += amount;

                    // Alternate row background
                    if (i % 2 === 0) {
                        doc.rect(50, y - 5, 495, 24).fill('#fafafa');
                    }

                    doc.fontSize(9).font('Helvetica').fillColor('#333')
                        .text(item.name || `Product #${item.product_id}`, col1 + 10, y, { width: 260 });

                    doc.fontSize(9).font('Helvetica').fillColor('#333')
                        .text(item.quantity.toString(), col2, y, { width: 60, align: 'center' });

                    doc.fontSize(9).font('Helvetica').fillColor('#333')
                        .text('₹' + parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 }), col3, y, { width: 70, align: 'right' });

                    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
                        .text('₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col4, y, { width: 70, align: 'right' });

                    y += 24;
                });
            } else {
                doc.fontSize(9).font('Helvetica').fillColor(secondaryColor)
                    .text('No items data available', col1 + 10, y);
                y += 24;
            }

            // ── Totals ──
            const totalsY = Math.max(y + 15, 500);

            doc.moveTo(350, totalsY - 5).lineTo(545, totalsY - 5).strokeColor(borderColor).stroke();

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text('Subtotal:', 350, totalsY + 5, { width: 100, align: 'left' });
            doc.fontSize(10).font('Helvetica').fillColor('#333')
                .text('₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 460, totalsY + 5, { width: 85, align: 'right' });

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text('Shipping:', 350, totalsY + 25, { width: 100, align: 'left' });
            doc.fontSize(10).font('Helvetica').fillColor('#30d158')
                .text('FREE', 460, totalsY + 25, { width: 85, align: 'right' });

            doc.fontSize(10).font('Helvetica').fillColor(secondaryColor)
                .text('GST (0%):', 350, totalsY + 45, { width: 100, align: 'left' });
            doc.fontSize(10).font('Helvetica').fillColor('#333')
                .text('₹0.00', 460, totalsY + 45, { width: 85, align: 'right' });

            doc.moveTo(350, totalsY + 60).lineTo(545, totalsY + 60).strokeColor(borderColor).stroke();

            doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
                .text('Total:', 350, totalsY + 68, { width: 100, align: 'left' });
            doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
                .text('₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 460, totalsY + 68, { width: 85, align: 'right' });

            // ── Footer ──
            const footerY = Math.max(totalsY + 110, 650);

            doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(borderColor).stroke();

            doc.fontSize(8).font('Helvetica').fillColor(secondaryColor)
                .text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY + 10, { align: 'center' })
                .text('For any queries, please contact info@axomdana.in', 50, footerY + 24, { align: 'center' })
                .text(`Generated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 50, footerY + 38, { align: 'center' });

            // ── Thank You ──
            doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
                .text('Thank you for your purchase!', 50, footerY + 60, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateInvoice };
