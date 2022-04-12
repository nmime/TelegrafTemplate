const admin = require('../../helpers/admin.js')
const User = require('../../models/user.js')

module.exports = async (ctx) => {
  if(ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()

    ctx.user.state = `admin_ban`
    return ctx.editMessageText(`Для добавления/удаления в/из бан(а) введите его id.`, { 
      ...admin.backKeyboard,
      parse_mode: "HTML"
    })
  }else{
    ctx.user.state = null

    const user = await User.findOne({ id: ctx.message.text })
    if(!user) return ctx.reply(`Пользователь с id ${ctx.message.text} не найден.`, admin.backKeyboard)
    user.ban = !user.ban
    await user.save()

    return ctx.replyWithHTML(`Пользователь ${user.name} ${user.ban ? 'забанен' : 'разбанен'}.`, admin.backKeyboard)
  }
}