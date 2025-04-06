import { Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

interface UseAppwriteOptions<T, P extends Record<string, string | number>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
}

interface UseAppwriteReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
}

// This custom hook is used to fetch data from Appwrite using a provided function and parameters. It manages loading state, error handling, and provides a refetch function.
// It can be used to simplify the process of making API calls and handling the response in a React component.
// It takes a function that returns a promise and parameters to be passed to that function. It also has an optional skip parameter to control whether the fetch should be skipped or not.
// The hook returns the fetched data, loading state, error message, and a refetch function to call the API again with new parameters.
export const useAppwrite = <T, P extends Record<string, string | number>>({
  fn,
  params = {} as P,
  skip = false,
}: UseAppwriteOptions<T, P>): UseAppwriteReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  // This useEffect hook is used to fetch data when the component mounts or when the params change. It will not run if the skip parameter is true.
  // It calls the fetchData function with the provided params to initiate the data fetching process.
  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  // This function is used to refetch the data with new parameters. It calls the fetchData function with the new parameters to initiate the data fetching process.
  // It can be used to refresh the data in the component when needed.
  const refetch = async (newParams: P) => await fetchData(newParams);

  return { data, loading, error, refetch };
};
