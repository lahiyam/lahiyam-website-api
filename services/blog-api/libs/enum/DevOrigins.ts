enum DevOrigins {
  LOCAL = "http://localhost:3001",
  DEV = "https://dev.lahiyam.com"
}

namespace DevOrigins {
  export function getAllowedOriginFromEvent(event: any) {
    let origin = event.headers.Origin;
    if (origin in DevOrigins) {
      return origin;
    } else {
      return DevOrigins.DEV;
    }
  }
}

export default DevOrigins;
