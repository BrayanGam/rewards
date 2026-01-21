import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/game/memory',
        name: 'MemoryMatch',
        component: () => import('../views/MemoryMatch.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/game/trivia',
        name: 'Trivia',
        component: () => import('../views/Trivia.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/game/puzzle',
        name: 'SlidingPuzzle',
        component: () => import('../views/SlidingPuzzle.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/game/puzzle-gallery',
        name: 'PuzzleGallery',
        component: () => import('../views/PuzzleGallery.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/cupones',
        name: 'Coupons',
        component: () => import('../views/Coupons.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/perfil',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (to.meta.requiresAuth && !session) {
        next('/login')
    } else if (to.path === '/login' && session) {
        next('/home')
    } else {
        next()
    }
})

export default router
