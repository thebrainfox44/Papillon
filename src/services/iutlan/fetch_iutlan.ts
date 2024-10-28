import axios from "axios";
import qs from "qs";
import pako from "pako";

class StudentDataFetcher {
  constructor () {
    this.baseUrl = "https://notes9.iutlan.univ-rennes1.fr";
    this.casUrl = "https://sso-cas.univ-rennes1.fr";
    this.cookies = new Map();
  }

  async login (username, password) {
    console.log("Starting login process...");

    // Step 1: Initial request to the login page
    const serviceUrl = `${this.baseUrl}/services/doAuth.php?href=https%3A%2F%2F${this.baseUrl}%2F`;
    console.log("Requesting login page...");
    const loginPageRes = await this.makeRequest({
      url: `${this.casUrl}/login?service=${encodeURIComponent(serviceUrl)}`,
      method: "GET",
    });
    console.log("Login page response:", loginPageRes.data);

    // Step 2: Extract execution token
    const executionMatch = loginPageRes.data.match(
      /name="execution" value="([^"]+)"/
    );
    if (!executionMatch) {
      throw new Error("Could not find execution token");
    }
    console.log("Execution token found:", executionMatch[1]);

    // Step 3: Submit login form
    const loginFormData = qs.stringify({
      username,
      password,
      execution: executionMatch[1],
      _eventId: "submit",
      geolocation: "",
    });
    console.log("Submitting login form...");
    const loginRes = await this.makeRequest(
      {
        url: `${this.casUrl}/login?service=${encodeURIComponent(serviceUrl)}`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: this.casUrl,
          Referer: `${this.casUrl}/login?service=${encodeURIComponent(
            serviceUrl
          )}`,
        },
      },
      loginFormData
    );
    console.log("Login form response:", loginRes.data);

    // Step 4: Handle CAS redirect
    if (loginRes.status === 302 && loginRes.headers.location) {
      const ticketUrl = loginRes.headers.location;
      console.log("Handling CAS redirect to:", ticketUrl);
      const ticketRes = await this.makeRequest({
        url: `${this.baseUrl}${new URL(ticketUrl).pathname}${
          new URL(ticketUrl).search
        }`,
        method: "GET",
        headers: {
          Referer: this.casUrl,
        },
      });
      console.log("Ticket response:", ticketRes.data);

      // Step 5: Handle service redirect
      if (ticketRes.status === 302 && ticketRes.headers.location) {
        const authRes = await this.makeRequest({
          url: `${this.baseUrl}${ticketRes.headers.location}`,
          method: "GET",
          headers: {
            Referer: this.casUrl,
          },
        });
        console.log("Auth response:", authRes.data);

        // Step 6: Final redirect to home page
        if (authRes.status === 302 && authRes.headers.location) {
          console.log("Final redirect to home page...");
          await this.makeRequest({
            url: `${this.baseUrl}${authRes.headers.location}`,
            method: "GET",
            headers: {
              Referer: this.casUrl,
            },
          });
        }
      }
    }

    // Step 7: Finally, fetch the student data
    console.log("Fetching student data...");
    return this.fetchStudentData();
  }

  async fetchStudentData () {
    const dataRes = await this.makeRequest({
      url: `${this.baseUrl}/services/data.php?q=dataPremi%C3%A8reConnexion`,
      method: "POST",
      headers: {
        Accept: "*/*",
        "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: this.baseUrl,
        Referer: this.baseUrl,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        TE: "trailers",
        Priority: "u=4",
      },
    });
    console.log("Student data response:", dataRes.data);

    const data = JSON.parse(dataRes.data);
    if (data.erreur) {
      throw new Error(data.erreur);
    }
    return data;
  }

  async makeRequest (options, postData = null) {
    const cookies = this.getCookieHeader(new URL(options.url).hostname);
    const defaultHeaders = {
      Host: new URL(options.url).hostname,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/png,image/svg+xml,*/*;q=0.8",
      "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      DNT: "1",
      "Sec-GPC": "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      Priority: "u=0, i",
      ...(cookies ? { Cookie: cookies } : {}),
    };

    const config = {
      method: options.method,
      url: options.url,
      headers: { ...defaultHeaders, ...options.headers },
      data: postData,
      responseType: "arraybuffer",
    };

    console.log("Making request to:", options.url);
    const response = await axios(config);
    console.log("Response received:", response.status);

    if (response.headers["set-cookie"]) {
      this.storeCookies(
        new URL(options.url).hostname,
        response.headers["set-cookie"]
      );
    }

    let decompressedData = response.data;
    const contentEncoding = response.headers["content-encoding"];
    console.log("Content-Encoding:", contentEncoding);

    if (contentEncoding === "gzip") {
      console.log("Decompressing gzip data...");
      decompressedData = pako.ungzip(response.data, { to: "string" });
    } else if (contentEncoding === "br") {
      console.log("Decompressing brotli data...");
      decompressedData = pako.inflate(response.data, { to: "string" });
    } else {
      decompressedData = response.data.toString();
    }

    return {
      status: response.status,
      headers: response.headers,
      data: decompressedData,
    };
  }

  storeCookies (domain, cookies) {
    if (!this.cookies.has(domain)) {
      this.cookies.set(domain, new Map());
    }

    const domainCookies = this.cookies.get(domain);
    cookies.forEach((cookie) => {
      const [keyValue, ...attributes] = cookie.split(";");
      const [key, value] = keyValue.split("=").map((s) => s.trim());

      domainCookies.set(key, {
        value,
        attributes: attributes.map((attr) => attr.trim()),
      });
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

async function getStudentData (username, password) {
  const fetcher = new StudentDataFetcher();
  return await fetcher.login(username, password);
}

export default getStudentData;
