import { describe, it, expect } from "vitest"
import { downloadUrlFor, serveUrlFor } from "../../src/request/request.js"

// VITE_API_URL = 'http://api.test' is set via vitest.config.js env

describe("downloadUrlFor", () => {
  it("returns downloadUrl from dest", () => {
    const bone = { dest: { downloadUrl: "/file/download/abc" } }
    expect(downloadUrlFor(bone)).toBe("http://api.test/json/file/download/abc")
  })

  it("returns thumbnail url when thumbnail=true and available", () => {
    const bone = { dest: { downloadUrl: "/file/download/abc", thumbnail: "/file/thumb/abc" } }
    expect(downloadUrlFor(bone, true)).toBe("http://api.test/json/file/thumb/abc")
  })

  it("falls back to downloadUrl when thumbnail requested but missing", () => {
    const bone = { dest: { downloadUrl: "/file/download/abc" } }
    expect(downloadUrlFor(bone, true)).toBe("http://api.test/json/file/download/abc")
  })

  it("returns null when dest has no downloadUrl and no thumbnail", () => {
    const bone = { dest: {} }
    expect(downloadUrlFor(bone)).toBeNull()
  })

  it("treats raw string as absolute URL", () => {
    expect(downloadUrlFor("https://cdn.example.com/file.jpg")).toBe("https://cdn.example.com/file.jpg")
  })

  it("prefixes raw relative string with api base", () => {
    expect(downloadUrlFor("/json/file/serve/xyz")).toBe("http://api.test/json/file/serve/xyz")
  })

  it("returns null for null bone", () => {
    expect(downloadUrlFor(null)).toBeNull()
  })

  it("uses custom renderer in thumbnail URL", () => {
    const bone = { dest: { thumbnail: "/file/thumb/abc" } }
    expect(downloadUrlFor(bone, true, "vi")).toBe("http://api.test/vi/file/thumb/abc")
  })
})

describe("serveUrlFor", () => {
  const googleUrl = "https://lh3.googleusercontent.com/abc123"

  it("converts Google serving URL to /file/serve path", () => {
    expect(serveUrlFor(googleUrl)).toBe("http://api.test/file/serve/lh3/abc123")
  })

  it("appends size segment", () => {
    expect(serveUrlFor(googleUrl, 400)).toBe("http://api.test/file/serve/lh3/abc123/400")
  })

  it("appends filename segment after size", () => {
    expect(serveUrlFor(googleUrl, 400, "photo.jpg")).toBe("http://api.test/file/serve/lh3/abc123/400/photo.jpg")
  })

  it("appends filename without size", () => {
    expect(serveUrlFor(googleUrl, null, "photo.jpg")).toBe("http://api.test/file/serve/lh3/abc123/photo.jpg")
  })

  it("appends options query param", () => {
    const url = serveUrlFor(googleUrl, null, null, "s800")
    expect(url).toContain("options=s800")
  })

  it("appends download flag", () => {
    const url = serveUrlFor(googleUrl, null, null, "", true)
    expect(url).toContain("download=true")
  })

  it("combines options and download", () => {
    const url = serveUrlFor(googleUrl, 200, null, "s200", true)
    expect(url).toContain("options=s200")
    expect(url).toContain("download=true")
  })

  it("passes through non-google URL unchanged (but prefixed)", () => {
    expect(serveUrlFor("/some/relative/path")).toBe("http://api.test/some/relative/path")
  })

  it("passes through absolute https non-google URL unchanged", () => {
    expect(serveUrlFor("https://cdn.example.com/img.jpg")).toBe("https://cdn.example.com/img.jpg")
  })

  it("returns api-prefixed url for null/undefined input", () => {
    // _absolute(null) returns null; serveUrlFor(null) has no match, calls _absolute(null)
    expect(serveUrlFor(null)).toBeNull()
  })
})
