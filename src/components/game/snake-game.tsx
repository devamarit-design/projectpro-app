"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useProjects } from "@/context/project-context"
import { useTranslation } from "@/lib/i18n-context"
import { Trophy, Play, RotateCcw, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore"

const GRID_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 0, y: -1 }
const GAME_SPEED = 150

interface LeaderboardEntry {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    score: number
    createdAt: any
}

export function SnakeGame({ showTitle = true }: { showTitle?: boolean }) {
    const { currentUser, users, currentTeam } = useProjects()
    const { t } = useTranslation()
    const [snake, setSnake] = useState(INITIAL_SNAKE)
    const [direction, setDirection] = useState(INITIAL_DIRECTION)
    const [food, setFood] = useState({ x: 15, y: 15, user: users[0] })
    const [isGameOver, setIsGameOver] = useState(false)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [gameStarted, setGameStarted] = useState(false)
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

    // Load High Score
    useEffect(() => {
        const saved = localStorage.getItem("snake-high-score")
        if (saved) setHighScore(parseInt(saved))
    }, [])

    // Fetch Leaderboard
    useEffect(() => {
        if (!currentTeam?.id || !currentUser?.id) return

        const q = query(
            collection(db, "game_scores"),
            where("orgId", "==", currentTeam.id),
            orderBy("score", "desc"),
            orderBy("createdAt", "desc"),
            limit(10)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as LeaderboardEntry))
            setLeaderboard(entries)
        })

        return () => unsubscribe()
    }, [currentTeam?.id, currentUser?.id])

    const saveScore = async (finalScore: number) => {
        if (!currentUser || !currentTeam || finalScore <= 0) return

        try {
            await addDoc(collection(db, "game_scores"), {
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar || "",
                score: finalScore,
                orgId: currentTeam.id,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error("Error saving score:", error)
        }
    }

    const getRandomFood = useCallback(() => {
        const x = Math.floor(Math.random() * GRID_SIZE)
        const y = Math.floor(Math.random() * GRID_SIZE)
        const randomUser = users[Math.floor(Math.random() * users.length)]
        return { x, y, user: randomUser }
    }, [users])

    const moveSnake = useCallback(() => {
        if (isGameOver || !gameStarted) return

        const newHead = {
            x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
            y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE
        }

        // Check Collision with self
        if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
            setIsGameOver(true)
            saveScore(score)
            if (score > highScore) {
                setHighScore(score)
                localStorage.setItem("snake-high-score", score.toString())
            }
            return
        }

        const newSnake = [newHead, ...snake]

        // Check Food
        if (newHead.x === food.x && newHead.y === food.y) {
            setScore(s => s + 10)
            setFood(getRandomFood())
        } else {
            newSnake.pop()
        }

        setSnake(newSnake)
    }, [snake, direction, food, isGameOver, gameStarted, score, highScore, getRandomFood, currentUser, currentTeam])

    useEffect(() => {
        if (gameStarted && !isGameOver) {
            gameLoopRef.current = setInterval(moveSnake, GAME_SPEED)
        } else {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current)
        }
        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current)
        }
    }, [gameStarted, isGameOver, moveSnake])

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!gameStarted) return;
            switch (e.key) {
                case "ArrowUp": if (direction.y === 0) setDirection({ x: 0, y: -1 }); break
                case "ArrowDown": if (direction.y === 0) setDirection({ x: 0, y: 1 }); break
                case "ArrowLeft": if (direction.x === 0) setDirection({ x: -1, y: 0 }); break
                case "ArrowRight": if (direction.x === 0) setDirection({ x: 1, y: 0 }); break
            }
        }
        window.addEventListener("keydown", handleKeyPress)
        return () => window.removeEventListener("keydown", handleKeyPress)
    }, [direction, gameStarted])

    const resetGame = () => {
        setSnake(INITIAL_SNAKE)
        setDirection(INITIAL_DIRECTION)
        setIsGameOver(false)
        setScore(0)
        setGameStarted(true)
        setFood(getRandomFood())
    }

    return (
        <div className="w-full space-y-6">
            {showTitle && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                            {t.navbar.bored}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t.bored.subtitle}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end text-amber-500">
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-bold">{t.bored.best.replace("{score}", highScore.toString())}</span>
                        </div>
                        <p className="text-2xl font-black text-primary">{t.bored.score.replace("{score}", score.toString())}</p>
                    </div>
                </div>
            )}

            {!showTitle && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                        <Gamepad2 className="w-5 h-5" />
                        <h2 className="text-xl font-bold">{t.navbar.bored}</h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold">
                        <span className="text-amber-500">{t.bored.best.replace("{score}", highScore.toString())}</span>
                        <span className="text-primary">{t.bored.score.replace("{score}", score.toString())}</span>
                    </div>
                </div>
            )}

            {/* Game Grid Container */}
            <div className="relative w-full aspect-square max-w-[500px] mx-auto overflow-hidden rounded-[2.5rem] p-4 glass-card border border-white/5 shadow-2xl">
                {/* Background Pattern/Plan */}
                <div
                    className="absolute inset-0 z-0 opacity-30 pointer-events-none blur-[1px]"
                    style={{
                        backgroundImage: 'url("/assets/office-plan.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="absolute inset-0 bg-white/20 dark:bg-black/40 z-[1] pointer-events-none" />

                <div
                    className="relative z-10 w-full h-full grid gap-0"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
                    }}
                >
                    {/* Snake */}
                    {snake.map((segment, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex items-center justify-center p-0.5 transition-all duration-150",
                                i === 0 ? "z-10" : "z-0 opacity-80 scale-90"
                            )}
                            style={{ gridColumnStart: segment.x + 1, gridRowStart: segment.y + 1 }}
                        >
                            <div className="w-full h-full rounded-lg bg-primary overflow-hidden border border-primary/50 shadow-lg">
                                {i === 0 && currentUser?.avatar ? (
                                    <img src={currentUser.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-primary/20" />
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Food */}
                    <div
                        className="flex items-center justify-center p-0.5 animate-bounce"
                        style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }}
                    >
                        <div className="w-full h-full rounded-full bg-amber-500 overflow-hidden border-2 border-white/20 shadow-xl">
                            {food.user?.avatar ? (
                                <img src={food.user.avatar} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[8px] font-bold">
                                    {food.user?.name?.charAt(0) || "T"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overlays */}
                {!gameStarted && !isGameOver && (
                    <div className="absolute inset-0 flex flex-center items-center justify-center bg-background/60 backdrop-blur-md z-20">
                        <button
                            onClick={() => setGameStarted(true)}
                            className="group flex flex-col items-center gap-4 p-8 rounded-3xl hover:bg-white/5 transition-all"
                        >
                            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                                <Play className="w-10 h-10 text-white fill-white ml-1" />
                            </div>
                            <span className="text-xl font-bold">{t.bored.start_game}</span>
                            <p className="text-sm text-muted-foreground">{t.bored.move_instruction}</p>
                        </button>
                    </div>
                )}

                {isGameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 backdrop-blur-md z-20 animate-in fade-in zoom-in">
                        <div className="bg-background/90 p-8 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
                            <h2 className="text-4xl font-black text-red-500">{t.bored.game_over}</h2>
                            <div>
                                <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-1">{t.bored.final_score}</p>
                                <p className="text-5xl font-black">{score}</p>
                            </div>
                            <button
                                onClick={resetGame}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                <RotateCcw className="w-5 h-5" />
                                {t.bored.try_again}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <Trophy className="w-5 h-5" />
                            <h2 className="text-xl font-bold">{t.bored.leaderboard}</h2>
                        </div>

                        <div className="space-y-3">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-2xl border border-white/5",
                                            entry.userId === currentUser?.id ? "bg-primary/10 border-primary/20" : "bg-muted/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 text-center font-bold text-muted-foreground">
                                                {index + 1}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-white/10 shrink-0">
                                                {entry.userAvatar ? (
                                                    <img src={entry.userAvatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                                        {entry.userName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-bold truncate max-w-[120px]">{entry.userName}</span>
                                        </div>
                                        <span className="text-xl font-black text-primary">{entry.score}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">{t.bored.no_scores}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.bored.instructions_title}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {t.bored.instructions_desc}
                        </p>
                        <div className="h-px bg-white/5" />
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t.bored.staff_power_title}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {t.bored.staff_power_desc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
