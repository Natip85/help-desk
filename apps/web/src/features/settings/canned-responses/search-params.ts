import { useQueryStates } from "nuqs";
import { createLoader, parseAsString } from "nuqs/server";

export const cannedResponseSearchParamsParser = {
  folderId: parseAsString,
};

export const loadCannedResponseSearchParams = createLoader(cannedResponseSearchParamsParser);

export function useCannedResponseSearchParams() {
  const [searchParams, setSearchParams] = useQueryStates(cannedResponseSearchParamsParser);

  const setFolderId = (folderId: string | null) => {
    void setSearchParams({ folderId });
  };

  return {
    folderId: searchParams.folderId,
    setFolderId,
  };
}
