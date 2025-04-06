import { Client, Account, Avatars, OAuthProvider } from 'react-native-appwrite';
import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from 'expo-web-browser';

export const config = {
  platform: 'com.project.realscout',
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
};
export const client = new Client();

client
  .setEndpoint(config.endpoint!)
  .setProject(config.project!)
  .setPlatform(config.platform!);

export const avatar = new Avatars(client);
export const account = new Account(client);

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
