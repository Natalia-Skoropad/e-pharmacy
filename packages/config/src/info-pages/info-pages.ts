import { ROUTES } from '../routes/client-routes';

//===================================================================

export const DELIVERY_PAYMENT_INFO = {
  path: ROUTES.DELIVERY_PAYMENT,
  title: 'Delivery and Payment',
  description:
    'Learn how E-PHARMACY orders are prepared, how pickup works, and which payment options can be used with partner pharmacies.',
  updatedAt: 'May 2026',
  highlights: [
    {
      title: 'Delivery',
      text: 'Pick up from a selected pharmacy or use postal delivery after the pharmacy confirms the order details.',
    },
    {
      title: 'Payment',
      text: 'Pay on receipt or use the bank account details provided by the selected pharmacy.',
    },
  ],
  sections: [
    {
      title: 'How the service works',
      content: [
        'E-PHARMACY is an online pharmacy platform that helps customers find medicines, compare pharmacy offers, and prepare online orders. The platform provides information about products, partner pharmacies, prices, availability, ratings, and order details.',
        'The final sale and product handover are completed by the selected licensed pharmacy. E-PHARMACY helps organize the order flow but does not replace the pharmacy that provides the product.',
      ],
    },
    {
      title: 'Pickup from pharmacy',
      content: [
        'When pickup is selected, the order is prepared by the chosen pharmacy. The customer can review the pharmacy address, phone number, working hours, and order summary before confirmation.',
        'The pharmacy may contact the customer to clarify availability, pickup time, or order details.',
      ],
    },
    {
      title: 'Postal delivery',
      content: [
        'Postal delivery can be selected during checkout when the pharmacy supports it. The customer provides name, phone number, delivery address or post office details, and any useful order comment.',
        'The pharmacy confirms the address and delivery details before handing the order to a carrier. Delivery price depends on the selected carrier and pharmacy conditions.',
      ],
    },
    {
      title: 'Payment on receipt',
      content: [
        'Payment on receipt means the customer pays when the order is received or picked up, according to the payment methods available at the selected pharmacy.',
        'The customer should check the final amount and product list before payment, especially when the order contains items from more than one pharmacy.',
      ],
    },
    {
      title: 'Payment by bank details',
      content: [
        'Some pharmacies can provide bank account details for payment. In this case, the payment information is shown in the pharmacy details or checkout flow when available.',
        'The payment purpose, recipient, and account details should be copied carefully. If something looks unclear, the customer should contact the pharmacy before paying.',
      ],
    },
  ],
} as const;

//===================================================================

export const RETURN_POLICY_INFO = {
  path: ROUTES.RETURN_POLICY,
  title: 'Return Policy',
  description:
    'Read the main return rules for medicines and medical goods ordered through the E-PHARMACY platform.',
  updatedAt: 'May 2026',
  sections: [
    {
      title: 'Medicines and medical goods',
      content: [
        'Medicines and medical-purpose goods of proper quality are usually not subject to return after purchase from a pharmacy. This rule exists because such products require strict storage, safety, and quality control conditions.',
        'If a product was properly supplied by the pharmacy and has no confirmed defect, the pharmacy may refuse a return according to applicable rules for pharmaceutical products.',
      ],
    },
    {
      title: 'Defective or improper-quality product',
      content: [
        'If the customer discovers a significant defect within the allowed period, the customer should contact the pharmacy where the product was purchased and provide proof of purchase.',
        'Depending on the situation and applicable law, the customer may request a refund or replacement with the same product or an equivalent product available from the seller.',
      ],
    },
    {
      title: 'Documents needed for a return request',
      content: [
        'To review a return request, the pharmacy may ask for the fiscal receipt, order details, product packaging, and documents confirming the issue with the product.',
        'For medicines, an expert conclusion from the competent quality-control authority may be required to confirm improper quality.',
      ],
    },
    {
      title: 'Where to send the request',
      content: [
        'Return questions should be sent to the pharmacy that supplied the product. The pharmacy is responsible for checking the purchase and explaining the next steps.',
        'E-PHARMACY can help customers understand where the order was placed, but the final decision belongs to the seller and the applicable legal rules.',
      ],
    },
  ],
} as const;

//===================================================================

export const USER_AGREEMENT_INFO = {
  path: ROUTES.USER_AGREEMENT,
  title: 'User Agreement',
  description:
    'These terms explain how customers may use E-PHARMACY, what the platform provides, and which responsibilities belong to users and partner pharmacies.',
  updatedAt: 'May 2026',
  sections: [
    {
      title: 'General terms',
      content: [
        'This User Agreement applies to the E-PHARMACY website and related customer services. By using the platform, the user confirms that they have read and accepted these terms.',
        'If the user does not agree with the terms, the user should not use the platform or create an account.',
      ],
    },
    {
      title: 'Purpose of the platform',
      content: [
        'E-PHARMACY is an information and order-preparation service. It helps users search for medicines, view pharmacy information, compare offers, add products to cart, and prepare checkout details.',
        'The platform is not a medical consultation service and does not replace professional advice from a doctor or pharmacist.',
      ],
    },
    {
      title: 'Partner pharmacies',
      content: [
        'Products, prices, availability, working hours, payment details, and delivery conditions are provided by partner pharmacies or generated from their available data.',
        'Partner pharmacies may update their information, confirm or reject orders, and set their own service conditions according to their licenses and internal rules.',
      ],
    },
    {
      title: 'User account',
      content: [
        'A user may create an account to manage profile information, favorite medicines, favorite pharmacies, cart items, and order history.',
        'The user is responsible for keeping login details secure and for providing accurate contact information during checkout.',
      ],
    },
    {
      title: 'Orders and checkout',
      content: [
        'An order created through E-PHARMACY is a request sent to the selected pharmacy. The final purchase is completed between the customer and the pharmacy that supplies the product.',
        'The customer should check product names, quantities, pharmacy address, delivery method, payment method, and contact details before confirming an order.',
      ],
    },
    {
      title: 'Limitations of liability',
      content: [
        'E-PHARMACY works to keep the platform clear, stable, and helpful, but cannot guarantee that every product or price will remain unchanged at the moment of pharmacy confirmation.',
        'The platform is not responsible for medical decisions made by users. Customers should follow prescriptions, product instructions, and professional recommendations.',
      ],
    },
    {
      title: 'Updates to the agreement',
      content: [
        'E-PHARMACY may update this agreement to reflect platform changes, legal requirements, or service improvements.',
        'The current version is published on this page. Continued use of the platform after updates means the user accepts the new version.',
      ],
    },
  ],
} as const;

//===================================================================

export const PERSONAL_DATA_NOTICE_INFO = {
  path: ROUTES.PERSONAL_DATA_NOTICE,
  title: 'Personal Data Processing Notice',
  description:
    'This notice explains what personal data E-PHARMACY may process, why it is needed, and how users can manage their rights.',
  updatedAt: 'May 2026',
  sections: [
    {
      title: 'Who controls personal data',
      content: [
        'E-PHARMACY processes personal data needed to provide customer account features, cart features, checkout, order history, and communication related to orders.',
        'Partner pharmacies may also process customer data when they receive an order request or provide products and services to the customer.',
      ],
    },
    {
      title: 'Personal data that may be processed',
      content: [
        'The platform may process name, email, phone number, delivery address or post office details, account photo, favorite items, cart items, order details, and technical data required for security and platform operation.',
        'The platform does not ask users to provide unnecessary sensitive information for ordinary shopping flow.',
      ],
    },
    {
      title: 'Why data is processed',
      content: [
        'Personal data is used to create and protect accounts, save profile details, prepare orders, show order history, manage favorites, contact the customer about an order, and improve platform reliability.',
        'Technical data can also be used to prevent abuse, protect sessions, and keep the service stable.',
      ],
    },
    {
      title: 'Sharing with partner pharmacies',
      content: [
        'When a customer confirms an order, the information required to process that order may be shared with the selected pharmacy.',
        'The pharmacy receives only the data needed for order preparation, confirmation, pickup, delivery, payment, or customer communication.',
      ],
    },
    {
      title: 'Cookies and similar technologies',
      content: [
        'The platform may use cookies or similar technologies to keep users signed in, remember interface choices, protect sessions, and understand basic platform performance.',
        'Users can manage cookies in their browser settings, but disabling some cookies may affect account and checkout functionality.',
      ],
    },
    {
      title: 'Storage period',
      content: [
        'Personal data is stored only for as long as needed for the purpose for which it was collected, unless a longer period is required by law or needed to protect legal interests.',
        'Account data can be updated by the user in the profile section where supported by the platform.',
      ],
    },
    {
      title: 'User rights',
      content: [
        'Users may request access to their personal data, correction of inaccurate information, deletion where applicable, restriction of processing, or additional information about processing.',
        'A request should clearly identify the account or order involved so the platform can review it accurately.',
      ],
    },
    {
      title: 'Security',
      content: [
        'E-PHARMACY uses technical and organizational measures intended to protect account and order data from unauthorized access, loss, or misuse.',
        'Users should also protect their passwords and avoid sharing account access with other people.',
      ],
    },
  ],
} as const;
