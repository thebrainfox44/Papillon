import axios from "axios";
import * as zlib from "pako";
import { Buffer } from "buffer";

class StudentDataFetcher {
  constructor () {
    this.baseUrl = "https://notes9.iutlan.univ-rennes1.fr";
    this.casUrl = "https://sso-cas.univ-rennes1.fr";
    this.cookies = new Map();
  }

  async login (username, password) {
    // Step 1: Fetch login page to get execution token
    const serviceUrl = `${
      this.baseUrl
    }/services/doAuth.php?href=${encodeURIComponent(this.baseUrl)}`;
    const loginPageResponse = await this.makeRequest(
      `${this.casUrl}/login?service=${encodeURIComponent(serviceUrl)}`,
      "GET"
    );

    const executionMatch = loginPageResponse.body.match(
      /name="execution" value="([^"]+)"/
    );
    if (!executionMatch) throw new Error("Execution token not found");

    // Step 2: Submit login form with token
    const loginData = new URLSearchParams({
      username,
      password,
      execution: executionMatch[1],
      _eventId: "submit",
      geolocation: "",
    });

    const loginResponse = await this.makeRequest(
      `${this.casUrl}/login?service=${encodeURIComponent(serviceUrl)}`,
      "POST",
      {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: this.casUrl,
        Referer: `${this.casUrl}/login?service=${encodeURIComponent(
          serviceUrl
        )}`,
      },
      loginData.toString()
    );

    // Follow CAS redirects if present
    if (loginResponse.status === 302 && loginResponse.headers["location"]) {
      await this.followRedirect(loginResponse.headers["location"]);
    }

    // Fetch data if login was successful
    return this.fetchStudentData();
  }

  async fetchStudentData () {
    // Make sure the user is logged in and cookies are set before fetching data
    const response = await this.makeRequest(
      `${this.baseUrl}/services/data.php?q=dataPremièreConnexion`,
      "POST",
      {
        Accept: "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: this.baseUrl,
        Referer: `${this.baseUrl}/`,
      }
    );

    const decodedData = zlib.inflate(new Uint8Array(response.data), {
      to: "string",
    });
    const data = JSON.parse(decodedData);

    if (data.erreur) throw new Error(data.erreur);
    return data;
  }

  async makeRequest (url, method, headers = {}, data = null) {
    const defaultHeaders = {
      "User-Agent": "Mozilla/5.0 (Mobile; rv:13.0) Gecko/20100101 Firefox/13.0",
      Accept: "application/json, text/html, */*; q=0.1",
      Cookie: this.getCookieHeader(new URL(url).hostname),
      ...headers,
    };

    const response = await axios({
      method,
      url,
      headers: defaultHeaders,
      data,
      responseType: "arraybuffer",
      maxRedirects: 0, // Prevent automatic redirects, as we handle them manually
      validateStatus: (status) => status < 500,
    });

    if (response.headers["set-cookie"]) {
      this.storeCookies(new URL(url).hostname, response.headers["set-cookie"]);
    }

    return {
      status: response.status,
      headers: response.headers,
      body: Buffer.from(response.data).toString("utf-8"),
    };
  }

  async followRedirect (url) {
    // Handles redirect by following the location header to simulate CAS login
    const response = await this.makeRequest(url, "GET", { Referer: url });
    if (response.status === 302 && response.headers["location"]) {
      return this.followRedirect(response.headers["location"]);
    }
    return response;
  }

  storeCookies (domain, cookies) {
    if (!this.cookies.has(domain)) this.cookies.set(domain, new Map());
    const domainCookies = this.cookies.get(domain);

    cookies.forEach((cookie) => {
      const [keyValue, ...attributes] = cookie.split(";");
      const [key, value] = keyValue.split("=").map((s) => s.trim());
      domainCookies.set(key, { value, attributes });
    });
  }

  getCookieHeader (domain) {
    const domainCookies = this.cookies.get(domain);
    if (!domainCookies) return "";
    return Array.from(domainCookies.entries())
      .map(([key, { value }]) => `${key}=${value}`)
      .join("; ");
  }
}

export async function getStudentData (username, password) {
  const fetcher = new StudentDataFetcher();
  await fetcher.login(username, password);
  return await fetcher.fetchStudentData();
}
