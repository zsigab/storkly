package app.storkly.scraper;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;

/**
 * Validates outbound URLs before fetch to mitigate SSRF.
 *
 * <p>Rejects non-http(s) schemes, unusual ports, and hostnames that resolve to
 * loopback / link-local / private / cloud-metadata / multicast addresses.
 *
 * <p>Best-effort against DNS rebinding: Jsoup re-resolves the hostname when fetching,
 * so a TTL=0 record could change between this check and the fetch. Pinning to a
 * resolved IP would break SNI/cert validation, so we accept that small window.
 */
@Slf4j
public final class SsrfGuard {

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");
    private static final Set<Integer> ALLOWED_PORTS = Set.of(80, 443, 8080, 8443);

    private SsrfGuard() {}

    public static void check(String url) {
        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            throw new BlockedUrlException("Invalid URL");
        }

        String scheme = uri.getScheme();
        if (scheme == null || !ALLOWED_SCHEMES.contains(scheme.toLowerCase())) {
            throw new BlockedUrlException("URL scheme not allowed");
        }

        String host = uri.getHost();
        if (host == null || host.isEmpty()) {
            throw new BlockedUrlException("URL has no host");
        }

        int port = uri.getPort();
        if (port != -1 && !ALLOWED_PORTS.contains(port)) {
            throw new BlockedUrlException("URL port not allowed");
        }

        InetAddress[] addrs;
        try {
            addrs = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new BlockedUrlException("Unable to resolve host");
        }

        for (InetAddress addr : addrs) {
            if (isBlocked(addr)) {
                log.warn("SSRF guard blocked url={} host={} resolved={}", url, host, addr.getHostAddress());
                throw new BlockedUrlException("URL host is not allowed");
            }
        }
    }

    private static boolean isBlocked(InetAddress addr) {
        return addr.isAnyLocalAddress()
                || addr.isLoopbackAddress()
                || addr.isLinkLocalAddress()
                || addr.isSiteLocalAddress()
                || addr.isMulticastAddress()
                || isIpv6UniqueLocal(addr)
                || isIpv4Cgnat(addr);
    }

    // 100.64.0.0/10 — RFC 6598 carrier-grade NAT
    private static boolean isIpv4Cgnat(InetAddress addr) {
        byte[] b = addr.getAddress();
        return b.length == 4 && (b[0] & 0xFF) == 100 && (b[1] & 0xC0) == 0x40;
    }

    // fc00::/7 — RFC 4193 IPv6 unique local addresses (not covered by isSiteLocalAddress)
    private static boolean isIpv6UniqueLocal(InetAddress addr) {
        byte[] b = addr.getAddress();
        return b.length == 16 && (b[0] & 0xFE) == 0xFC;
    }

    public static final class BlockedUrlException extends RuntimeException {
        BlockedUrlException(String message) {
            super(message);
        }
    }
}
