import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import * as Colyseus from 'colyseus.js'
import { useAuthStore } from './auth'

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
}

export const useGameStore = defineStore('game', () => {
    // ─── Server URL ──────────────────────────────────────────────────────────
    // Use /colyseus path prefix so Vite can proxy ALL Colyseus traffic
    // (HTTP matchmake + room WebSocket) through one reliable fixed-path rule.
    //
    //   Local  : ws://localhost:5173/colyseus → Vite strips /colyseus → ws://localhost:2567
    //   Ngrok  : wss://xxx.ngrok.io/colyseus → ngrok → Vite → ws://localhost:2567
    //
    // A fixed prefix is far more reliable than a regex for WebSocket upgrade proxying.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const gameServerUrl = `${protocol}//${window.location.host}/colyseus`

    // REST endpoints use relative paths — Vite proxy handles /rooms, /roomByCode
    const gameApiBase = ''

    const client = new Colyseus.Client(gameServerUrl)

    // ─── State ───────────────────────────────────────────────────────────────
    // shallowRef is CRITICAL: Vue's deep reactive proxy breaks Colyseus Room's
    // internal signal handlers (onJoin, onMessage …), preventing the view from
    // switching from Lobby → Game when room.value is set.
    const room = shallowRef<Colyseus.Room | null>(null)
    const currentRoomId = ref<string | null>(null)   // 4-char display code
    const lobbyRooms = ref<any[]>([])
    const chatMessages = ref<any[]>([])
    const isHost = ref(false)
    const authStore = useAuthStore()

    // ─── Lobby ───────────────────────────────────────────────────────────────
    async function fetchRooms() {
        try {
            const res = await fetch(`${gameApiBase}/rooms`)
            const rooms = await res.json()
            lobbyRooms.value = [...rooms]
            console.log('[rooms] fetched:', rooms.length, 'rooms')
        } catch (e) {
            console.error('[rooms] fetch error', e)
        }
    }

    async function findRoomByCode(code: string): Promise<string | null> {
        try {
            const res = await fetch(`${gameApiBase}/roomByCode/${code.toUpperCase()}`)
            if (!res.ok) return null
            const data = await res.json()
            return data.found ? data.roomId : null
        } catch (e) {
            return null
        }
    }

    async function joinLobby() {
        await fetchRooms()
        try {
            const lobby = await client.joinOrCreate('lobby')
            lobby.onMessage('rooms', (rooms) => {
                lobbyRooms.value = [...rooms]
            })
            lobby.onMessage('+', ([roomId, roomData]: [string, any]) => {
                const index = lobbyRooms.value.findIndex((r) => r.roomId === roomId)
                if (index !== -1) {
                    const updated = [...lobbyRooms.value]
                    updated[index] = roomData
                    lobbyRooms.value = updated
                } else {
                    lobbyRooms.value = [...lobbyRooms.value, roomData]
                }
            })
            lobby.onMessage('-', (roomId) => {
                lobbyRooms.value = lobbyRooms.value.filter((r) => r.roomId !== roomId)
            })
        } catch (e) {
            console.error('[lobby] error', e)
        }
    }

    // ─── Room helpers ─────────────────────────────────────────────────────────
    function setupRoomListeners(r: Colyseus.Room) {
        r.onMessage('chat_message', (message) => {
            chatMessages.value = [...chatMessages.value, message]
        })
        r.onMessage('error', (message) => {
            console.warn('Game error:', message)
        })
        r.onMessage('game_started', () => {
            console.log('Game started!')
        })
    }

    // ─── Actions ──────────────────────────────────────────────────────────────
    async function createGame() {
        try {
            const code = generateCode()
            const r = await client.create('match', {
                username: authStore.user?.username,
                code,
            })
            currentRoomId.value = code
            isHost.value = true
            setupRoomListeners(r)
            room.value = r   // set last so shallowRef triggers the view switch
            console.log('[game] Created room', r.id, 'code:', code)
        } catch (e) {
            console.error('[game] Create game error', e)
        }
    }

    async function joinGame(input: string) {
        try {
            let realRoomId = input

            if (input.length === 4) {
                // Prefer REST lookup by code
                const found = await findRoomByCode(input)
                if (found) {
                    realRoomId = found
                } else {
                    // Fallback: search local lobby list
                    const inLobby = lobbyRooms.value.find(
                        (r) => (r.metadata as any)?.code === input.toUpperCase()
                    )
                    if (inLobby) realRoomId = inLobby.roomId
                }
            }

            const r = await client.joinById(realRoomId, {
                username: authStore.user?.username,
            })
            // Wait a tick for state to sync
            await new Promise(resolve => setTimeout(resolve, 200))
            currentRoomId.value = (r.state as any)?.code || input
            isHost.value = false
            setupRoomListeners(r)
            room.value = r   // set last so shallowRef triggers the view switch
            console.log('[game] Joined room', r.id)
        } catch (e) {
            console.error('[game] Join game error', e)
        }
    }

    function sendChat(text: string) {
        room.value?.send('chat_message', { text })
    }

    function leaveGame() {
        if (room.value) {
            room.value.leave()
            room.value = null
            chatMessages.value = []
            isHost.value = false
            currentRoomId.value = null
        }
    }

    return {
        client,
        room,
        currentRoomId,
        isHost,
        lobbyRooms,
        chatMessages,
        joinLobby,
        fetchRooms,
        createGame,
        joinGame,
        leaveGame,
        sendChat,
    }
})
