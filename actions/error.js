const config = require('../config.json')
const fs = require('fs').promises

const convertChars = require('../helpers/convertChars')

module.exports = async (err, ctx) => {
  if (
    err.code === 429 &&
    err.description?.startsWith('Too Many Requests: retry after') &&
    (Date.now() - config.lastFloodError > 180000 || !config.lastFloodError)
  ) {
    await ctx.telegram.sendMessage(
      process.env.DEV_ID,
      `FLOOD ERROR in ${ctx.updateType}[${ctx.updateSubTypes}] | ${
        (ctx?.message?.text &&
          Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
        ctx?.callbackQuery?.data ||
        ctx?.inlineQuery?.query ||
        'empty'
      }
      \n<i>${err.description}</i>`,
      { parse_mode: 'HTML' }
    )

    console.error(
      `${new Date().toLocaleString('ru')} SLOW ANSWER in FLOOD ERROR in ${
        ctx.updateType
      }[${ctx.updateSubTypes}] | ${
        (ctx?.message?.text &&
          Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
        ctx?.callbackQuery?.data ||
        ctx?.inlineQuery?.query ||
        'empty'
      }`,
      err
    )

    config.lastFloodError = Date.now()
    return fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  } else if (
    err.code === 400 &&
    err.description ===
      'Bad Request: query is too old and response timeout expired or query ID is invalid' &&
    (Date.now() - config.lastTimeoutError > 180000 || !config.lastTimeoutError)
  ) {
    await ctx.telegram.sendMessage(
      process.env.DEV_ID,
      `SLOW ANSWER in ${ctx.updateType}[${ctx.updateSubTypes}] | ${ctx.callbackQuery.data}
        \n<i>${err.description}</i>`,
      { parse_mode: 'HTML' }
    )

    console.error(
      `${new Date().toLocaleString('ru')} SLOW ANSWER in ${ctx.updateType}[${
        ctx.updateSubTypes
      }] | ${ctx.callbackQuery.data}`,
      err
    )

    config.lastTimeoutError = Date.now()
    return fs.writeFile('config.json', JSON.stringify(config, null, '  '))
  } else if (
    (err.code === 400 || err.code === 403) &&
    err.description &&
    [
      'Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message',
      'Bad Request: message to delete not found',
      'Forbidden: bot was blocked by the user',
      "Bad Request: message can't be deleted for everyone"
    ].includes(err.description)
  ) {
    return
  }

  console.error(
    `${new Date().toLocaleString('ru')} ERROR in ${ctx.updateType}[${
      ctx.updateSubTypes
    }] | ${ctx.from?.id || 'noUserId'} | ${ctx.chat?.id || 'noChatId'} | ${
      (ctx?.message?.text &&
        Array.from(ctx.message.text).slice(0, 300).join('')) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } ${ctx.user?.state || 'noState'}`,
    err
  )

  return ctx.telegram.sendMessage(
    process.env.DEV_ID,
    `ERROR in ${ctx.updateType}[${ctx.updateSubTypes}] | ${
      ctx.from?.id || 'noUserId'
    } | ${ctx.chat?.id || 'noChatId'} | ${
      (ctx.message?.text &&
        Array.from(convertChars(ctx.message.text)).slice(0, 300).join('')) ||
      ctx.callbackQuery?.data ||
      ctx.inlineQuery?.query ||
      'noData'
    } ${ctx.user?.state || 'noState'}
    \n<code>${err.stack}</code>\n${
      (err.on && `<code>${JSON.stringify(err.on, null, 2)}</code>`) || 'noStack'
    }`,
    { parse_mode: 'HTML' }
  )
}