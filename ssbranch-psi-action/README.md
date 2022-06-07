# Page Speed Insights GitHub action for Smartsites' Magento 2 sites

This action uses [Google's Page Speed Insights](https://developers.google.com/speed/docs/insights/v5/about) to generate a report on a Smartsites' Magento 2 shop performance. It generates both desktop and mobile report on every push into a pull request and posts insights' scores in a comment, along with the report URL.

## Development

To prepare running this action locally for development,

- [Generate a personal Page Speed Insights API key](https://developers.google.com/speed/docs/insights/v5/get-started?hl=ru#APIKey)
- Put the key at `test-secrets.conf`, as in [`test-secrets.conf.sample`](test-secrets.conf.sample)
- Install [act](https://github.com/nektos/act) utility
  
To run the action locally: `bin/dev/run`


## [Inputs](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)

See [action.yml](action.yml)

## Example usage

Add this to a project repository where you want this workflow, modify 
`tested_paths` variable to select what to check:

```yaml
steps:
  - name: Page Speed Insights automation for new pull requests
    uses: smart-sites/psi-action@master
    id: psi
    with:
      dev_site_base_url: https://shop.smartwebsitedesign.com
      ssbranch_subdomain: 123-add-feature
      tested_paths: "[ \"/\", \"/ppc-marketing/\" ]"
      threshold: 70
```
