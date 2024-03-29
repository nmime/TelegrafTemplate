const User = require('../../models/user')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(`Получаю статистику, ожидайте`)

  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  )
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    0,
    0,
    0,
    0
  )
  const week = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
    0,
    0,
    0,
    0
  )
  const month = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 30,
    0,
    0,
    0,
    0
  )

  const promises = [
    User.countDocuments(),
    User.countDocuments({ alive: true }),
    User.countDocuments({ alive: true, subscribed: true }),
    User.countDocuments({
      alive: true,
      $or: [{ from: '' }, { from: { $exists: false } }]
    }),

    User.countDocuments({ alive: true, lastMessage: { $gte: today } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: week } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: month } }),

    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ alive: true, createdAt: { $gte: today } }),
    User.countDocuments({
      alive: true,
      $or: [{ from: null }, { from: { $exists: false } }],
      createdAt: { $gte: today }
    }),

    User.countDocuments({ createdAt: { $gte: yesterday, $lte: today } }),
    User.countDocuments({
      alive: true,
      createdAt: { $gte: yesterday, $lte: today }
    }),
    User.countDocuments({
      alive: true,
      $or: [{ from: null }, { from: { $exists: false } }],
      createdAt: { $gte: yesterday, $lte: today }
    }),

    User.countDocuments({ createdAt: { $gte: month } }),
    User.countDocuments({ alive: true, createdAt: { $gte: month } }),

    User.aggregate([
      { $match: { alive: true } },
      { $group: { _id: '$langCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]

  const [
    all,
    alive,
    subscribed,
    from,
    dau,
    wau,
    mau,
    forDay,
    aliveForDay,
    withoutRefForDay,
    forYesterday,
    aliveForYesterday,
    withoutRefForYesterday,
    forMonth,
    aliveForMonth,
    langCodes
  ] = await Promise.all(promises)

  const text = `Всего: ${all.format(0)}
Живых: ${alive.format(0)} (${Math.round((alive / all) * 100)}%)
Прошедщих ОП: ${subscribed.format(0)} (${Math.round(
    (subscribed / alive) * 100
  )}%)
Без реф: ${from.format(0)}

DAU: ${dau.format(0)} (${Math.round((dau / wau) * 100)}%)
WAU: ${wau.format(0)} (${Math.round((wau / mau) * 100)}%)
MAU: ${mau.format(0)} (${Math.round((mau / alive) * 100)}%)

Сегодня: +${forDay.format(0)} (+${aliveForDay.format(
    0
  )}) (+${withoutRefForDay.format(0)} без реф)
Вчера: +${forYesterday.format(0)} (+${aliveForYesterday.format(
    0
  )})  (+${withoutRefForYesterday.format(0)} без реф)
Месяц: +${forMonth.format(0)} (+${aliveForMonth.format(0)}) 

${langCodes
  .filter((lang) => lang.count > (langCodes[0].count / 100) * 1)
  .map(
    (lang) =>
      `${lang._id?.toUpperCase()}: ${lang.count.format(0)} (${Math.round(
        (lang.count / alive) * 100
      )}%)`
  )
  .join(', ')}`

  return ctx.editMessageText(
    text,
    Markup.inlineKeyboard([
      [Markup.callbackButton('Обновить', 'admin_stat')],
      [Markup.callbackButton('‹ Назад', 'admin_back')]
    ]).extra({ parse_mode: 'HTML' })
  )
}
