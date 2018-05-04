import express from 'express';
import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';

import { connectToDB } from './database';

// Start the http server
const startServer = async () => {
  const { User } = require('./database/models');

  // GraphQL Types
  const typeDefs = `
    type User {
      _id: ID!
      name: String
      password: String
    }

    type Mutation {
      addBlock(height: UserInput): Block
    }

    input UserInput {
      height: Int!
    }

    type Block {
      height: Int!
      rollOnce: Int!
      roll(numRolls: Int!): [Int]
    }

    type Address {
      legacy: String
      cashAddr: String
    }

    type Transaction {
      txid: String
    }

    type Query {
      getBlock(height: Int): Block
      getAddress(address: String): Address
      getTransaction(txid: String): Transaction
      users: [User]
    }
  `;

  class Block {
    constructor(height) {
      this.height = height;
    }

    rollOnce() {
      return 1 + Math.floor(Math.random() * this.height);
    }

    roll({numRolls}) {
      var output = [];
      for (var i = 0; i < numRolls; i++) {
        output.push(this.rollOnce());
      }
      return output;
    }
  }

  class Address {
    constructor(legacy, cashAddr) {
      this.legacy = legacy;
      this.cashAddr = cashAddr;
    }
  }

  class Transaction {
    constructor(txid) {
      this.txid = txid;
    }
  }

  // GraphQL resolvers
  const resolvers = {
    Query: {
      users: async () => {
        const res = await User.find();
        return res;
      },
      getBlock: async ({height}) => {
        return new Block(height || 6);
      },
      getAddress: async ({address}) => {
        return new Address(address, address);
      },
      getTransaction: async ({height}) => {
        return new Transaction(height || 6);
      }
    },

    Mutation: {
      addUser: async(root, args) => {
        const res = await User.create(args.input);
        return res;
      },
    },
  };

  // Define a schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Initiate express and define routes
  const app = express();
  app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
  app.use('/', graphiqlExpress({ endpointURL: '/graphql' }));

  // Initiate the server
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port: ${process.env.PORT || 3000}`);
  });
};

// Connecting to DB and then start the server
const dbConnectAndStartServer = async () => {
  try {
    await connectToDB();
    console.log('Connected to Mongo successfully');
    startServer();
  } catch (err) {
    console.error(`Error connecting to mongo - ${err.message}`);
    process.exit(1);
  }
};

// Entry point
dbConnectAndStartServer();
