const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

type BaseRequest = {
  owner: string;
  repo: string;
  path: string;
};

type UpdateRequest = BaseRequest & {
  content: string;
  message: string;
  sha?: string | null;
};

type DeleteRequest = BaseRequest & {
  message: string;
  sha: string;
};

const encodePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const withAuthHeaders = (headers: HeadersInit = {}, requireToken = false) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token && requireToken) {
    throw new GitHubApiError(
      "Thiếu biến môi trường GITHUB_TOKEN để thực hiện thao tác ghi.",
      500
    );
  }

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  } satisfies HeadersInit;
};

const request = async <T>(
  path: string,
  init: RequestInit,
  requireToken = false
): Promise<T> => {
  const headers = withAuthHeaders(init.headers, requireToken);
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch (error) {
      // Ignored: fallback to status text
    }

    throw new GitHubApiError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const getFile = async ({ owner, repo, path }: BaseRequest) => {
  const data = await request<
    | {
        type: string;
        content: string;
        encoding: string;
        sha: string;
        path: string;
      }
    | Array<unknown>
  >(`/repos/${owner}/${repo}/contents/${encodePath(path)}`, {
    method: "GET"
  });

  if (Array.isArray(data)) {
    throw new GitHubApiError("Đường dẫn yêu cầu là một thư mục, không phải file.", 400);
  }

  if (data.type !== "file") {
    throw new GitHubApiError("Đường dẫn yêu cầu không phải là file.", 400);
  }

  const buffer = Buffer.from(data.content, data.encoding ?? "base64");

  return {
    content: buffer.toString("utf-8"),
    sha: data.sha,
    path: data.path
  };
};

export const updateFile = async ({
  owner,
  repo,
  path,
  content,
  message,
  sha
}: UpdateRequest) => {
  const payload: Record<string, string> = {
    message: message || `Update ${path} via GitHub Content Bridge`,
    content: Buffer.from(content, "utf-8").toString("base64")
  };

  if (sha) {
    payload.sha = sha;
  }

  const data = await request<{
    content: { sha: string; path: string };
  }>(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    true
  );

  return {
    sha: data.content.sha,
    path: data.content.path
  };
};

export const deleteFile = async ({ owner, repo, path, message, sha }: DeleteRequest) => {
  await request(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sha
      })
    },
    true
  );
};
