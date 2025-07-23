import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "0f6a6d07-9f24-434f-8ca1-52f95d142bd5");
  requestHeaders.set("x-createxyz-project-group-id", "00f34e61-8ff1-44bb-a357-e0f7941257d8");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}