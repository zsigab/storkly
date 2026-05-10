package app.storkly.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SlugUtilTest {

    @Test
    void generate_basicAscii() {
        assertThat(SlugUtil.generate("My Registry")).isEqualTo("my-registry");
    }

    @Test
    void generate_singleAccent() {
        assertThat(SlugUtil.generate("café")).isEqualTo("cafe");
    }

    @Test
    void generate_multipleAccents() {
        assertThat(SlugUtil.generate("Ödön")).isEqualTo("odon");
    }

    @Test
    void generate_mixedAsciiAndAccents() {
        assertThat(SlugUtil.generate("Café Ödön")).isEqualTo("cafe-odon");
    }

    @Test
    void generate_leadingAndTrailingSpaces() {
        assertThat(SlugUtil.generate("  baby registry  ")).isEqualTo("baby-registry");
    }

    @Test
    void generate_multipleConsecutiveHyphens() {
        assertThat(SlugUtil.generate("baby---registry")).isEqualTo("baby-registry");
    }

    @Test
    void generate_specialCharactersStripped() {
        assertThat(SlugUtil.generate("baby@registry!")).isEqualTo("baby-registry");
    }

    @Test
    void generate_tildeN() {
        assertThat(SlugUtil.generate("niño")).isEqualTo("nino");
    }

    @Test
    void generate_caron() {
        assertThat(SlugUtil.generate("Čeština")).isEqualTo("cestina");
    }

    @Test
    void generate_emptyAfterStripping() {
        String result = SlugUtil.generate("!!!###");
        assertThat(result).isEmpty();
    }

    @Test
    void generate_leadingTrailingHyphensRemoved() {
        assertThat(SlugUtil.generate("-baby registry-")).isEqualTo("baby-registry");
    }

    @Test
    void generate_spacesBecomeSingleHyphen() {
        assertThat(SlugUtil.generate("baby   registry")).isEqualTo("baby-registry");
    }

    @Test
    void generate_apostropheStripped() {
        assertThat(SlugUtil.generate("Mikey's Registry")).isEqualTo("mikeys-registry");
    }
}
