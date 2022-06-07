import fetch from "node-fetch"
import * as core from "@actions/core";
import psi from "psi";

/**
 * Runs a Page Speed Insight on a URL
 * @param {string} url
 * @param {string} strategy 'desktop' or 'mobile'
 * @return {Promise<number>} Score, in percent
 */
const runInsight = (url, strategy) => {
    const key = core.getInput('psi_key');
    return psi(url, {
        ...(key ? {key} : undefined),
        ...(key ? undefined : {nokey: "true"}),
        strategy,
        format: "cli",
        threshold: Number(core.getInput("threshold"))
    }).then(result => Math.round(result.data.lighthouseResult.categories.performance.score * 100));
};

/**
 * Returns a complete analysis of a URL
 * @param {string} url
 * @return {Promise<{report_url: string, mobile_score: number, desktop_score: number}>}
 */
const analyzeUrl = async (url) => {
    return {
        url,
        desktop_score: await runInsight(url, 'desktop'),
        mobile_score: await runInsight(url, 'mobile'),
        report_url: 'https://pagespeed.web.dev/report?url=' + encodeURIComponent(url) + '&hl=en',
    };
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function validateInputs() {
    let paths = JSON.parse(core.getInput('tested_paths'));
    if (!Array.isArray(paths)) {
        throw new Error(
            'Input tested_paths must be a JSON array'
        )
    }

    const problematicPaths = [];

    for (let path of paths) {
        if (path[0] !== '/') {
            problematicPaths.push(path)
        }
    }
    if (problematicPaths.length > 0) {
        throw new Error(
            "Each tested_paths input value must start from / character. Problematic paths:\n"
            + problematicPaths.join("\n")
        )
    }
    let devSiteBaseUrl = core.getInput('dev_site_base_url');
    if (!isValidHttpUrl(devSiteBaseUrl)) {
        throw new Error(
            'Input dev_site_base_url ' + devSiteBaseUrl + ' is not a valid URL'
        )
    }
    if (devSiteBaseUrl.split('/').length > 3) {
        throw new Error(
            'Input dev_site_base_url ' + devSiteBaseUrl + ' must not have anything after domain name'
        )
    }
}

/**
 * Builds a URL to test from validated action inputs
 * @param {URL} devSiteBaseUrl
 * @param {string} subdomain
 * @param {string} path
 * @return string
 */
function buildTestedUrl(devSiteBaseUrl, subdomain, path) {
    return devSiteBaseUrl.protocol + '//' + subdomain + '.' + devSiteBaseUrl.host + path
}

/**
 *
 * @param insights
 * @return {string} Text for a comment with the report on Github
 */
function buildInsightsReportComment(insights) {
    const threshold = core.getInput('threshold')

    function formatScore(score) {
        const formatted = "**" + score + "%**";
        if (score < threshold) {
            return formatted + ":anger:";
        } else {
            return formatted
        }
    }

    function formatInsightUrl(insight) {
        const url = insight.url
        if (insight.desktop_score < threshold || insight.mobile_score < threshold) {
            return url + " :red_circle:"
        }
        return url
    }

    return insights
        .map(insight =>
            "### "
            + formatInsightUrl(insight)
            + "\nDesktop: "
            + formatScore(insight.desktop_score)
            + " | Mobile: "
            + formatScore(insight.mobile_score)
            + " | [**Report**]("
            + insight.report_url
            + ")"
        ).join("\n<hr/>\n\n");
}

(async () => {
    validateInputs()
    try {
        const devSiteBaseUrl = new URL(core.getInput('dev_site_base_url'))
        const subdomain = core.getInput('ssbranch_subdomain')
        const urls =
            JSON.parse(core.getInput('tested_paths'))
                .map(path => buildTestedUrl(devSiteBaseUrl, subdomain, path))
        // Warm up the website's internal cache before sampling
        // and check if any of the URLs are redirected (fail if any redirect)
        await Promise.all(
            urls
                .map(url =>
                    fetch(url, {redirect: "error", method: "GET"})
                        .then(result => console.log(result, '<<<<'))
                        .catch(e => {
                            console.log(e.message, e.stack, e)
                            throw e;
                        })
                )
        ).catch(e => {
            throw e
        })
        core.setOutput(
            'report',
            buildInsightsReportComment(
                await Promise.all(urls.map(analyzeUrl))
            )
        )
    } catch (error) {
        core.setFailed(error.message);
    }
})();