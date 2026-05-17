package app.storkly.scraper;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SsrfGuardTest {

    @Test
    void check_rejectsNonHttpScheme() {
        assertThatThrownBy(() -> SsrfGuard.check("file:///etc/passwd"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class)
                .hasMessageContaining("scheme");
        assertThatThrownBy(() -> SsrfGuard.check("gopher://example.com/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("ftp://example.com/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsLoopback() {
        assertThatThrownBy(() -> SsrfGuard.check("http://127.0.0.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://localhost/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://[::1]/")).isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsLinkLocalAndCloudMetadata() {
        // AWS / GCP / Azure / Oracle / DigitalOcean / OpenStack metadata
        assertThatThrownBy(() -> SsrfGuard.check("http://169.254.169.254/latest/meta-data/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://169.254.0.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsPrivateIpv4Ranges() {
        assertThatThrownBy(() -> SsrfGuard.check("http://10.0.0.1/")).isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://172.16.0.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://192.168.1.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsCgnatRange() {
        assertThatThrownBy(() -> SsrfGuard.check("http://100.64.0.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://100.127.255.254/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsIpv6UniqueLocal() {
        assertThatThrownBy(() -> SsrfGuard.check("http://[fc00::1]/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://[fd12:3456::1]/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsMulticast() {
        assertThatThrownBy(() -> SsrfGuard.check("http://224.0.0.1/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsAnyLocal() {
        assertThatThrownBy(() -> SsrfGuard.check("http://0.0.0.0/")).isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsDisallowedPort() {
        assertThatThrownBy(() -> SsrfGuard.check("http://example.com:22/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class)
                .hasMessageContaining("port");
        assertThatThrownBy(() -> SsrfGuard.check("http://example.com:3306/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
        assertThatThrownBy(() -> SsrfGuard.check("http://example.com:6379/"))
                .isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_rejectsMalformedUrl() {
        assertThatThrownBy(() -> SsrfGuard.check("not a url")).isInstanceOf(SsrfGuard.BlockedUrlException.class);
    }

    @Test
    void check_acceptsPublicIp() {
        // 8.8.8.8 is parsed as a literal IPv4 address — no DNS needed.
        assertThatCode(() -> SsrfGuard.check("https://8.8.8.8/")).doesNotThrowAnyException();
    }

    @Test
    void check_acceptsExplicitStandardPorts() {
        assertThatCode(() -> SsrfGuard.check("https://8.8.8.8:443/")).doesNotThrowAnyException();
        assertThatCode(() -> SsrfGuard.check("http://8.8.8.8:80/")).doesNotThrowAnyException();
    }
}
