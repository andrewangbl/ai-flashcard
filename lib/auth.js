import bcrypt from 'bcryptjs';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const dynamoDbClient = new DynamoDBClient(awsConfig);
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

console.log('AWS Region:', process.env.AWS_REGION);
console.log('AWS Access Key:', process.env.AWS_ACCESS_KEY_ID ? 'Loaded' : 'Not Loaded');
console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Loaded' : 'Not Loaded');

export const signUpUser = async (email, password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = email;
  const createdAt = new Date().toISOString();

  const params = {
    TableName: 'Users',
    Item: {
      userId,
      email,
      passwordHash,
      createdAt,
      files: [],  // If you don't need this, you can also remove 'files'.
    },
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return { success: true, message: 'User created successfully.' };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, message: 'Failed to create user.' };
  }
};

export const signInUser = async (email, password) => {
  const params = {
    TableName: 'Users',
    Key: {
      userId: email,
    },
  };

  try {
    const { Item } = await ddbDocClient.send(new GetCommand(params));
    if (!Item) {
      return { success: false, message: 'User not found.' };
    }

    const isPasswordValid = await bcrypt.compare(password, Item.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password.' };
    }

    return { success: true, message: 'Authenticated successfully.', user: Item };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, message: 'Failed to sign in.' };
  }
};

export const signOut = async () => {
  localStorage.removeItem('email');
}

export const checkUserAuthenticated = async (email) => {
  const params = {
    TableName: 'Users',
    Key: {
      userId: email,
    },
  };

  try {
    const { Item } = await ddbDocClient.send(new GetCommand(params));
    return Item ? { success: true, user: Item } : { success: false };
  } catch (error) {
    console.error('Error checking user authentication:', error);
    if (error.name === 'UnrecognizedClientException') {
      console.error('AWS credentials may be invalid or not properly configured');
      // You might want to clear the local storage here to force a new login
      localStorage.removeItem('email');
    }
    return { success: false, error: error.message };
  }
};
