import { NextRequest, NextResponse } from "next/server";

const TABLECRM_API_URL = "https://app.tablecrm.com/api/v1";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;

  const sourceUrl = new URL(request.url);
  const targetUrl = new URL(`${TABLECRM_API_URL}/${path.join("/")}`);

  sourceUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    Accept: "application/json"
  };

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store"
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyText = await request.text();

    if (bodyText) {
      init.body = bodyText;
      headers["Content-Type"] = "application/json";
    }
  }

  try {
    const response = await fetch(targetUrl.toString(), init);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const data = await response.json();

      return NextResponse.json(data, {
        status: response.status
      });
    }

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Не удалось выполнить запрос к TableCRM",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      {
        status: 500
      }
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}