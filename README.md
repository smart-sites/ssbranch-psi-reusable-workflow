# ssbranch-psi-reusable-workflow

[Переиспользуемый workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows) для Github Actions, который [разворачивает тестовую ветку](https://github.com/smart-sites/ssbranch) на поддомене сервера Magento 2 и прогоняет на ней проверку Google Page Speed Insights.

# Проблемы, с которыми столкнулся

- Сайт может редиректить с поддомена ssbranch на основной домен: https://github.com/smart-sites/digitalwarehouse.com