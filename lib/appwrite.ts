import {
  Client,
  Account,
  ID,
  Databases,
  OAuthProvider,
  Avatars,
  Query,
  Storage,
} from 'react-native-appwrite';
import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from 'expo-web-browser';

export const config = {
  platform: 'com.project.realscout',
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  database: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  agentsCollection: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  galleriesCollection: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollection: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  propertiesCollection:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
};
export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.project!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login() {
  try {
    // Generate a redirect URL to handle the OAuth response using expo Linking
    const redirectURL = Linking.createURL('/'); // Redirect to the root page
    // Request the OAuth token from Appwrite using the google provider
    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectURL,
    );
    if (!response) throw new Error('Failed to login');

    // Open the browser to handle the OAuth flow and wait for the response
    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectURL,
    );
    // If the browser result is not successful, throw an error
    if (browserResult.type !== 'success')
      throw new Error('Create OAuth2 token failed');

    // Parse the OAuth response and exchange it for an Appwrite session
    const url = new URL(browserResult.url);
    // Check if the URL is the expected redirect URL
    const secret = url.searchParams.get('secret')?.toString();
    if (!secret) throw new Error('Failed to login');

    // Extract the userId from the URL search params
    // This is the user ID returned by Appwrite after successful authentication
    const userId = url.searchParams.get('userId')?.toString();
    if (!userId) throw new Error('Failed to login');

    // Create a session using the userId and secret obtained from the OAuth response
    // This will authenticate the user and create a session in Appwrite
    const session = await account.createSession(userId, secret);
    if (!session) throw new Error('Failed to Create session');

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const result = await account.get();
    if (result.$id) {
      const userAvatar = avatar.getInitials(result.name);

      return {
        ...result,
        avatar: userAvatar.toString(),
      };
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.database!,
      config.propertiesCollection!,
      [Query.orderAsc('$createdAt'), Query.limit(5)],
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc('$createdAt')];

    if (filter && filter !== 'All')
      buildQuery.push(Query.equal('type', filter));

    if (query)
      buildQuery.push(
        Query.or([
          Query.search('name', query),
          Query.search('address', query),
          Query.search('type', query),
        ]),
      );

    if (limit) buildQuery.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.database!,
      config.propertiesCollection!,
      buildQuery,
    );

    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// write function to get property by id
export async function getPropertyById({ id }: { id: string }) {
  try {
    const result = await databases.getDocument(
      config.database!,
      config.propertiesCollection!,
      id,
    );
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}
