type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue>;

function buildQuery(params: QueryParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    throw new Error(text || "Сервер вернул не JSON");
  }

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.detail ??
      data?.message ??
      data?.error ??
      "Ошибка запроса к API";

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data as T;
}

export async function tablecrmGet<T>(
  path: string,
  params: QueryParams
): Promise<T> {
  const response = await fetch(
    `/api/tablecrm/${path}${buildQuery(params)}`,
    {
      method: "GET",
      cache: "no-store"
    }
  );

  return parseResponse<T>(response);
}

export async function tablecrmPost<T>(
  path: string,
  params: QueryParams,
  body: unknown
): Promise<T> {
  const response = await fetch(
    `/api/tablecrm/${path}${buildQuery(params)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  return parseResponse<T>(response);
}