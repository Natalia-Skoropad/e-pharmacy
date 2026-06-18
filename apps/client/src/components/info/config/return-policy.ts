import { ROUTES } from '@/lib/routes';

//===================================================================

export const RETURN_POLICY_INFO = {
  path: ROUTES.RETURN_POLICY,
  title: 'Return Policy',
  description:
    'Read the main return rules for products and medical goods ordered through the E-PHARMACY platform.',
  updatedAt: 'May 2026',
  sections: [
    {
      title: 'Products and medical goods',
      content: [
        'Products and medical-purpose goods of proper quality are usually not subject to return after purchase from a pharmacy. This rule exists because such products require strict storage, safety, and quality control conditions.',
        'If a product was properly supplied by the pharmacy and has no confirmed defect, the pharmacy may refuse a return according to applicable rules for pharmaceutical products.',
      ],
    },
    {
      title: 'Defective or improper-quality product',
      content: [
        'If the client discovers a significant defect within the allowed period, the client should contact the pharmacy where the product was purchased and provide proof of purchase.',
        'Depending on the situation and applicable law, the client may request a refund or replacement with the same product or an equivalent product available from the seller.',
      ],
    },
    {
      title: 'Documents needed for a return request',
      content: [
        'To review a return request, the pharmacy may ask for the fiscal receipt, order details, product packaging, and documents confirming the issue with the product.',
        'For products, an expert conclusion from the competent quality-control authority may be required to confirm improper quality.',
      ],
    },
    {
      title: 'Where to send the request',
      content: [
        'Return questions should be sent to the pharmacy that supplied the product. The pharmacy is responsible for checking the purchase and explaining the next steps.',
        'E-PHARMACY can help clients understand where the order was placed, but the final decision belongs to the seller and the applicable legal rules.',
      ],
    },
  ],
} as const;
