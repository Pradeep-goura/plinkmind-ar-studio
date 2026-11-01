import { describe, expect, it } from 'vitest'
import { detectInAppBrowser, detectPlatform } from '../../src/features/publishing/environment'

const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const iphoneInstagram =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0'
const android =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const androidWebView =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36'
const windows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const mac =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('detectPlatform', () => {
  it('detects an iPhone', () => {
    expect(detectPlatform(iphone)).toBe('ios')
  })

  it('detects an iPad that reports itself as a Mac', () => {
    expect(detectPlatform(mac, 5)).toBe('ios')
  })

  it('treats a real Mac without a touch screen as other', () => {
    expect(detectPlatform(mac, 0)).toBe('other')
  })

  it('detects an Android phone', () => {
    expect(detectPlatform(android)).toBe('android')
  })

  it('treats a Windows computer as other', () => {
    expect(detectPlatform(windows)).toBe('other')
  })
})

describe('detectInAppBrowser', () => {
  it('detects the Instagram browser', () => {
    expect(detectInAppBrowser(iphoneInstagram)).toBe('Instagram')
  })

  it('detects an Android WebView', () => {
    expect(detectInAppBrowser(androidWebView)).toBe('another app')
  })

  it('does not flag Safari on iPhone', () => {
    expect(detectInAppBrowser(iphone)).toBeNull()
  })

  it('does not flag Chrome on Android', () => {
    expect(detectInAppBrowser(android)).toBeNull()
  })
})