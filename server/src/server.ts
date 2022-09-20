import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { convertHoursStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHoursSprint } from './utils/convert-minutes-to-hours-string'

const app = express()

app.use(cors())
app.use(express.json())

const prisma = new PrismaClient()

// Métodos HTTP / API RESTfull:
// GET(buscar/listar), POST(criar), PUT(editar), PATCH(edição simples), DELETE(remover)
// Tipos de Parametros:
// Query: Usado para filtros ou paginação
// Route: Identifica um ID especifico
// Body: Usado para enviar varias requisições (tipo formulário)

app.get('/games', async (request, response) => {
	const games = await prisma.game.findMany({
		include: {
			_count: {
				select: {
					ads: true,
				}
			}
		}
	})


	return response.json(games)
})

app.post('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;
	const body: any = request.body;

	const ad = await prisma.ad.create({
		data: {
			gameId,
			name: body.name,
			yearsPlaying: body.yearsPlaying,
			discord: body.discord,
			weekDays: body.weekDays.join(','),
			hoursStart: convertHoursStringToMinutes(body.hoursStart),
			hoursEnd: convertHoursStringToMinutes(body.hoursEnd),
			useVoiceChannel: body.useVoiceChannel
		}
	})

	return response.status(201).json(ad)
})

app.get('/games/:id/ads', async (request, response) => {
	const gameId = request.params.id;

	const ads = await prisma.ad.findMany({
		select: {
			id: true,
			name: true,
			weekDays: true,
			useVoiceChannel: true,
			yearsPlaying: true,
			hoursStart: true,
			hoursEnd: true
		},
		where: {
			gameId,
		},
		orderBy: {
			createAt: 'desc'
		}
	})

	return response.json(ads.map(ad => {
		return {
			...ad,
			weekDays: ad.weekDays.split(','),
			hoursStart: convertMinutesToHoursSprint(ad.hoursStart),
			hoursEnd: convertMinutesToHoursSprint(ad.hoursEnd)
		}
	}))
})

app.get('/ads/:id/discord', async (request, response) => {
	const adId = request.params.id;

	const ad = await prisma.ad.findUniqueOrThrow({
		select: {
			discord: true,
		},
		where: {
			id: adId
		}
	})

	return response.json({
		discord: ad.discord
	})
})

app.listen(3333)