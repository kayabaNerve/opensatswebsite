import { NextApiRequest, NextApiResponse } from 'next'

import { CURRENCY, MIN_AMOUNT, MAX_AMOUNT } from '../../config'
import { formatAmountForStripe } from '../../utils/stripe-helpers'

import Stripe from 'stripe'
import { PayReq } from '../../utils/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { amount, project_name, project_slug, email, name }: PayReq =
    req.body


  if (req.method === 'POST') {
    try {
      // Validate the amount that was passed from the client.
      if (!(amount >= MIN_AMOUNT)) {
        throw new Error('Invalid amount.')
      }
      // Create Checkout Sessions from body params.
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        submit_type: 'donate',
        payment_method_types: ['card'],
        line_items: [
          {
            name: `OpenSats donation: ${project_name}`,
            amount: formatAmountForStripe(amount, CURRENCY),
            currency: CURRENCY,
            quantity: 1,
          },
        ],
        metadata: {
          donor_email: email || null,
          donor_name: name || null,
        },
        success_url: `${req.headers.origin}/thankyou`,
        cancel_url: `${req.headers.origin}/`,
        // We need metadata in here for some reason
        payment_intent_data: {
          metadata: {
            donor_email: email || null,
            donor_name: name || null,
          },
        },
      }
      const checkoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create(params)

      res.status(200).json(checkoutSession)
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: (err as Error).message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
