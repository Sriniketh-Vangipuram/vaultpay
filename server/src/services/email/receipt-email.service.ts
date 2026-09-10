import transporter from "../../config/email";


interface ReceiptEmailInput{
    recipientEmail:string;
    clientName:string;
    invoiceNumber:string;
    amount:number;
    currency:string;
    pdfBuffer:Buffer;
}

const formatCurrency=(amount:number,currency:string):string=>{

    return new Intl.NumberFormat("en-US",{
        style:"currency",
        currency:currency.toUpperCase(),
    }).format(amount);
};

export const sendReceiptEmail=async(input:ReceiptEmailInput,):Promise<void>=>{
    const amount=formatCurrency(
        input.amount,
        input.currency,
    )

    await transporter.sendMail({
        from:process.env.SMTP_FROM || process.env.SMTP_USER,
        to:input.recipientEmail,
        subject:`Payment Receipt - ${input.invoiceNumber}`,
        text:[
            `Hello ${input.clientName},`,
            "",
            `Your payment for invoice ${input.invoiceNumber} has been successfully received.`,
            `Amount paid: ${amount}`,

            "",
            "Your payment receipt is attached to this email.",
            "",
            "Thank you for your business.",
            "",
            "Nexus Corporate Services",
        ].join("\n"),

        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Payment Received</h2>

        <p>Hello ${input.clientName},</p>

        <p>
          Your payment for invoice
          <strong>${input.invoiceNumber}</strong>
          has been successfully received.
        </p>

        <p>
          <strong>Amount Paid:</strong> ${amount}
        </p>

        <p>
          Your payment receipt is attached to this email.
        </p>

        <p>Thank you for your business.</p>

        <p>
          <strong>Nexus Corporate Services</strong>
        </p>
      </div>
    `,

    attachments:[
        {
            filename:`${input.invoiceNumber}-receipt.pdf`,
            content:input.pdfBuffer,
            contentType:"application/pdf",
        },
    ],

    });
};
