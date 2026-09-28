/**
 * OpenAPI 3.0.3 Specification for IRCTC Next-Gen REST API
 */

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'IRCTC Next-Gen Railway REST API Suite',
    version: '1.0.0',
    description: 'Production-grade enterprise RESTful API and SQLite engine powering Indian Railways Next-Gen ticketing, live telemetry, and passenger records.',
    contact: {
      name: 'IRCTC Engineering Platform',
      url: 'https://irctc.co.in',
      email: 'tech-support@irctc.co.in'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:8086',
      description: 'Local Production REST API Server'
    },
    {
      url: '',
      description: 'Current Origin Host'
    }
  ],
  tags: [
    { name: 'System', description: 'API Health, telemetry, and uptime indicators' },
    { name: 'Trains', description: 'Train lookup, search engine, halts and dynamic availability' },
    { name: 'Bookings', description: 'Transactional reservation and instant PNR generation' },
    { name: 'PNR Status', description: 'Real-time passenger charting and berth allocation' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'System Health & Diagnostic Telemetry',
        description: 'Returns real-time server uptime, SQLite database connectivity state, and loaded metrics.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'API and database are healthy and responding.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    database: { type: 'string', example: 'sqlite-native-v22' },
                    dbFile: { type: 'string', example: 'd:/can mockup/server/railway.db' },
                    version: { type: 'string', example: '1.0.0' },
                    uptime: { type: 'integer', example: 124 },
                    timestamp: { type: 'string', format: 'date-time' },
                    stats: {
                      type: 'object',
                      properties: {
                        trainsLoaded: { type: 'integer', example: 13 },
                        totalBookings: { type: 'integer', example: 3 },
                        totalPassengers: { type: 'integer', example: 6 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trains/search': {
      get: {
        tags: ['Trains'],
        summary: 'Search Trains & Dynamic Class Availability',
        description: 'Searches Indian Railways schedule by origin, destination, date, quota, and train type filters.',
        operationId: 'searchTrains',
        parameters: [
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'NDLS' },
            description: 'Origin station code (e.g. NDLS, MMCT, MAS)'
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'BSB' },
            description: 'Destination station code (e.g. BSB, HWH, SBC)'
          },
          {
            name: 'date',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date', default: '2026-09-25' },
            description: 'Journey Date (YYYY-MM-DD)'
          },
          {
            name: 'quota',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['GN', 'TQ', 'LD', 'PT'], default: 'GN' },
            description: 'Reservation Quota (GN: General, TQ: Tatkal, LD: Ladies, PT: Premium Tatkal)'
          },
          {
            name: 'vandeOnly',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Filter only Vande Bharat and Tejas Express trains'
          },
          {
            name: 'availableOnly',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Filter only trains having confirmed seats available'
          },
          {
            name: 'acOnly',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: false },
            description: 'Filter only AC coaches (1A, 2A, 3A, CC, EC)'
          }
        ],
        responses: {
          '200': {
            description: 'List of matching trains with calculated class availability.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 1 },
                    searchParams: { type: 'object' },
                    trains: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          trainNo: { type: 'string', example: '22436' },
                          trainName: { type: 'string', example: 'VANDE BHARAT EXPRESS' },
                          type: { type: 'string', example: 'Vande Bharat 2.0' },
                          fromStation: { type: 'string', example: 'NDLS' },
                          toStation: { type: 'string', example: 'BSB' },
                          departureTime: { type: 'string', example: '06:00' },
                          arrivalTime: { type: 'string', example: '14:00' },
                          duration: { type: 'string', example: '8h 00m' },
                          distanceKm: { type: 'integer', example: 759 },
                          classes: { type: 'object' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/trains/{trainNo}': {
      get: {
        tags: ['Trains'],
        summary: 'Get Detailed Train Schedule & Amenities',
        description: 'Fetches route halts, catering/WiFi telemetry, and live running status by train number.',
        operationId: 'getTrainByNo',
        parameters: [
          {
            name: 'trainNo',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '22436' },
            description: '5-digit Indian Railways train number'
          }
        ],
        responses: {
          '200': {
            description: 'Train profile and schedule found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    train: { type: 'object' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Train number not found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Train #99999 not found' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Instant Railway Ticket Reservation',
        description: 'Calculates exact fare breakdown with GST & reservation surcharge, reserves seats atomically, and assigns authentic 10-digit PNR.',
        operationId: 'createBooking',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['trainNo', 'classCode', 'journeyDate', 'passengers'],
                properties: {
                  trainNo: { type: 'string', example: '22436' },
                  classCode: { type: 'string', example: 'CC' },
                  journeyDate: { type: 'string', format: 'date', example: '2026-09-25' },
                  quota: { type: 'string', enum: ['GN', 'TQ', 'LD', 'PT'], default: 'GN', example: 'GN' },
                  travelInsurance: { type: 'boolean', default: true, example: true },
                  paymentMethod: { type: 'string', default: 'UPI', example: 'UPI / BHIM' },
                  passengers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name', 'age', 'gender'],
                      properties: {
                        name: { type: 'string', example: 'Rajesh Kumar Sharma' },
                        age: { type: 'integer', example: 34 },
                        gender: { type: 'string', enum: ['M', 'F', 'T'], example: 'M' },
                        berthPref: { type: 'string', example: 'Window (WS)' },
                        mealPref: { type: 'string', example: 'Veg Meal' },
                        srCitizen: { type: 'boolean', example: false }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Booking created successfully with confirmed PNR and allocated berths.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    pnr: { type: 'string', example: '4829104821' },
                    trainNo: { type: 'string', example: '22436' },
                    trainName: { type: 'string', example: 'VANDE BHARAT EXPRESS' },
                    classBooked: { type: 'string', example: 'CC (AC Chair Car)' },
                    fareTotal: { type: 'string', example: '₹ 1,514' },
                    chartStatus: { type: 'string', example: 'CHART PREPARED' },
                    passengers: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid reservation request or missing mandatory parameters.'
          }
        }
      }
    },
    '/api/pnr/{pnrNo}': {
      get: {
        tags: ['PNR Status'],
        summary: 'Check PNR Status & Charting Details',
        description: 'Fetches real-time passenger confirmation status, allocated coach & berth numbers, and station chart status.',
        operationId: 'getPnrStatus',
        parameters: [
          {
            name: 'pnrNo',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^[0-9]{10}$', example: '2847193852' },
            description: '10-digit Indian Railways PNR number'
          }
        ],
        responses: {
          '200': {
            description: 'PNR journey record found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pnr: { type: 'string', example: '2847193852' },
                    trainNo: { type: 'string', example: '22436' },
                    trainName: { type: 'string', example: 'VANDE BHARAT EXPRESS' },
                    fromStation: { type: 'string', example: 'NDLS (New Delhi)' },
                    toStation: { type: 'string', example: 'BSB (Varanasi Jn)' },
                    journeyDate: { type: 'string', example: '24 Sep 2026' },
                    classBooked: { type: 'string', example: 'CC (AC Chair Car)' },
                    chartStatus: { type: 'string', example: 'CHART PREPARED' },
                    passengers: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          '404': {
            description: 'PNR not found in railway database.'
          }
        }
      }
    }
  }
};

module.exports = { OPENAPI_SPEC };
