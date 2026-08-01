#!/bin/sh
#
# Единая подпись коммитов в репозитории.
#
# Проект ведётся под одной учётной записью, и подписать коммит другой легко
# по невнимательности: достаточно закоммитить из соседней рабочей копии
# или забыть про глобальный git config.
#
# Список нежелательных форм хранится закодированным: иначе файл проверки
# содержал бы ровно те строки, которые он же и запрещает, и находился бы
# поиском наравне с ними.

FORBIDDEN=$(printf '%s' 'a2luZGRyYWdvbnxzaGFwa2lufGFya2FkaT95fGFya2FkeQ==' | base64 -d)

EXPECTED_NAME='CodeComplainer'
EXPECTED_EMAIL='143932669+CodeComplainer@users.noreply.github.com'

fail() {
    echo ""
    echo "  x $1"
    echo ""
    shift
    for line in "$@"; do echo "    $line"; done
    echo ""
    exit 1
}

check_identity() {
    name=$(git config user.name)
    email=$(git config user.email)

    if printf '%s %s' "$name" "$email" | grep -Eiq "$FORBIDDEN"; then
        fail "Коммит подписан не той личностью: $name <$email>" \
            "Исправить для текущей копии:" \
            "" \
            "  git config user.name  '$EXPECTED_NAME'" \
            "  git config user.email '$EXPECTED_EMAIL'"
    fi

    if [ "$email" != "$EXPECTED_EMAIL" ]; then
        fail "Ожидается почта $EXPECTED_EMAIL, а настроена: ${email:-не задана}" \
            "Исправить:" \
            "" \
            "  git config user.email '$EXPECTED_EMAIL'"
    fi
}
