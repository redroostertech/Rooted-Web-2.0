module.exports = {

  db: process.env.MONGODB || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/stripe-membership',

  oneDay: 86400000,
  timeOut: 72000000,
  sessionSecret: process.env.SESSION_SECRET || '3847gt38owr74uhiu3h589ew7gioseub5789egsot87wv4',
  sessionRefresh: process.env.SESSION_REFRESH || 'fbhs8o74gr875gt587ugo5t7o8475e4g5t4h9y8d5ho589i4uh4y589ho',
  sessionRefreshLimit: process.env.SESSION_REFRESH_LIMIT || 1814400000,

  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || ''
  },

  stripeOptions: {
    apiKey: process.env.STRIPE_KEY || '',
    stripePubKey: process.env.STRIPE_PUB_KEY || '',
    defaultPlan: 'free',
    plans: ['free', 'silver', 'gold', 'platinum'],
    planData: {
      'free': {
        name: 'Free',
        price: 0
      },
      'silver': {
        name: 'Silver',
        price: 0
      },
      'gold': {
        name: 'Gold',
        price: 0
      },
      'platinum': {
        name: 'Platinum',
        price: 0
      }
    }
  },

  googleAnalytics: process.env.GOOGLE_ANALYTICS || '',

  zoom: {
    key: process.env.ZOOM_KEY || 'z8O78FV9TtG8H9lIxqwR6w',
    secret: process.env.ZOOM_SECRET || 'jtNg8JEVVPJKCUy40U8qRUktJ37fuzwBglQF'
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'AC5d98b26a8dbeedc6246fbed6d6fcd5dc',
    authToken: process.env.TWILIO_AUTH_TOKEN || '51c7554d0b8334a906cc844d8fdb9772'
  },

  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyC8-wum1nrL4NkL4GHJJmhfBcpQyG1ZDIA',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'rooted-test.firebaseapp.com',
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://rooted-test.firebaseio.com',
    projectID: process.env.FIREBASE_PROJECT_ID || 'rooted-test',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'rooted-test.appspot.com',
    messengingSenderID: process.env.FIREBASE_MESSAGING_SENDER_ID || '316478127099',
    storeFilename: process.env.FIREBASE_STORAGE_FILENAME || './rooted-test-7d1b0827d760.json',
    appID: process.env.FIREBASE_APP_ID || '1:316478127099:web:61ce489a39d6fdad02a95e',
    measurementID: process.env.FIREBASE_MEASUREMENT_ID || 'G-BGB70ZYWQV',
  },

  mailjet : {
    apiKey: process.env.MAILJET_API_KEY || 'b3711ac51c20213f29f627828b864471',
    apiSecret: process.env.MAILJET_API_SECRET || '4b1b0d115a79c620e323ab576e80df26'
  }
};
