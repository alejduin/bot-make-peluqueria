import { addKeyword, EVENTS } from "@bot-whatsapp/bot";
import AIClass from "../services/ai";
import { clearHistory, handleHistory, getHistoryParse } from "../utils/handleHistory";
import { getFullCurrentDate } from "../utils/currentDate";
import { appToCalendar } from "src/services/calendar";
import { typing } from "src/utils/composing";

const generatePromptToFormatDate = (history: string) => {
    const prompt = `Fecha de Hoy:${getFullCurrentDate()}, Basado en el Historial de conversacion: 
    ${history}
    ----------------
    Fecha ideal:...dd / mm hh:mm`

    return prompt
}

const generateJsonParse = (info: string) => {
    const prompt = `tu tarea principal es analizar la información proporcionada en el contexto y generar un objeto JSON que se adhiera a la estructura especificada a continuación. 

    Contexto: "${info}"
    
    {
        "name": "Leifer",
        "interest": "n/a",
        "value": "0",
        "email": "fef@fef.com",
        "startDate": "2024/02/15 00:00:00" asegurate que la fecha siempre contenga YYYY/MM/DD hh:mm:ss
    }
    
    Objeto JSON a generar:`

    return prompt
}

/**
 * Encargado de pedir los datos necesarios para registrar el evento en el calendario
 */
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (ctx, { flowDynamic }) => {
    await flowDynamic('Ok, voy a pedirte unos datos para agendar')
    await flowDynamic('¿Cual es tu nombre?')
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, extensions, provider }) => {
    await state.update({ name: ctx.body })
    const ai = extensions.ai as AIClass
    await typing(ctx, provider)
    const history = getHistoryParse(state)
    const text = await ai.createChat([
        {
            role: 'system',
            content: generatePromptToFormatDate(history)
        }
    ], 'gpt-4')

    await handleHistory({ content: text, role: 'assistant' }, state)
    await flowDynamic(`¿Me confirmas fecha y hora?: ${text}`)
    await state.update({ startDate: text })
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic }) => {
        await flowDynamic(`Ultima pregunta ¿Cual es tu email?`)
    })
    .addAction({ capture: true }, async (ctx, { state, extensions, flowDynamic }) => {
        const infoCustomer = `Name: ${state.get('name')}, StarteDate: ${state.get('startDate')}, email: ${ctx.body}`
        const ai = extensions.ai as AIClass

        const text = await ai.createChat([
            {
                role: 'system',
                content: generateJsonParse(infoCustomer)
            }
        ])

        await appToCalendar(text, ctx.from)
        clearHistory(state)
        await flowDynamic('Listo! agendado Buen dia')
    })

export { flowConfirm }