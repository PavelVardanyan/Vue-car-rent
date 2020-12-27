import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import router from './router'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
    plugins: [createPersistedState()],
    state: {
        vehicles: [],
        locations: [],
        filteredVehicles: [],
        currentVehicle: {},
        location: null,
        pickup: '',
        dropoff: '',
        user: {},
        token: '',
        loginErrors: [],
        invalidCredentials: ''
    },
    getters: {
        allVehicles: state => state.vehicles,
        allLocations: state => state.locations,
        filterdVehicles: state => state.filteredVehicles,
        currentVehicle: state => state.currentVehicle,
        pickupDate: state => state.pickup,
        dropOffDate: state => state.dropoff,
        user: state => state.user,
        token: state => state.token,
        loginErrors: state => state.loginErrors,
        invalidCredentials: state => state.invalidCredentials,
    },
    mutations: {
        GET_VEHICLES: (state, vehicles) => {
            state.vehicles = vehicles
        },

        GET_LOCATIONS: (state, locations) => {
            state.locations = locations
        },

        SET_FILTERED: (state, vehicles) => {
            state.filteredVehicles = vehicles
        },

        SET_VEHICLE: (state, vehicle) => {
            state.currentVehicle = vehicle
        },
        SET_LOCATION: (state, location) => {
            state.location = location
        },
        SET_PICKUP: (state, date) => {
            state.pickup = date
        },
        SET_DROPOFF: (state, date) => {
            state.dropoff = date
        },
        SET_USER: (state, user) => {
            state.user = user
        },
        SET_TOKEN: (state, token) => {
            state.token = token
        },
        SET_LOGIN_ERRORS: (state, loginErrors) => {
            state.loginErrors = loginErrors
        },
        SET_INVALID_CREDENTIALS: (state, invalidCredentials) => {
            state.invalidCredentials = invalidCredentials
        },
        LOGOUT: (state) => {
            state.token = ''
        }
    },
    actions: {
        getVehicles({ commit }) {
            axios.get('http://api.vue-rentacar.localhost/vehicles').then(response => {
                commit('GET_VEHICLES', response.data)
            })
        },
        getLocations({ commit }) {
            axios.get('http://api.vue-rentacar.localhost/locations/list').then(response => {
                commit('GET_LOCATIONS', response.data)
            })
        },
        getVehicle({ commit, state }, slug) {
            const vehicle = this.state.vehicles.find(vehicle => vehicle.slug === slug)
            commit('SET_VEHICLE', vehicle)
        },
        filterVehicles({ commit, state }) {
            const filtered = state.vehicles.filter(vehicle => {
                const foundLocations = vehicle.locations.findIndex(
                    location => location.id === this.state.location
                )

                return foundLocations !== -1
            })

            const filteredVehicles = []

            filtered.forEach(vehicle => {
                if (vehicle.dates.length > 0) {
                    const overlaps = []

                    vehicle.dates.forEach(date => {
                        const startDate1 = new Date(date.pickup)
                        const endDate1 = new Date(date.drop_off)
                        const startDate2 = new Date(this.state.pickup)
                        const endDate2 = new Date(this.state.dropoff)

                        overlaps.push(startDate1 < endDate2 && startDate2 < endDate1)
                    })

                    if (!overlaps.includes(true)) {
                        filteredVehicles.push(vehicle)
                    }

                    return
                }

                filteredVehicles.push(vehicle)
            })

            commit('SET_FILTERED', filteredVehicles)
        },
        setLocation({ commit, state }, value) {
            commit('SET_LOCATION', value)
        },
        filterOnApi({ commit }, value) {
            axios
                .get(`http://api.vue-rentacar.localhost/vehicles/filter/${value}`)
                .then(response => {
                    commit('SET_FILTERED', response.data)
                })
        },
        setDates({ commit, state }, date) {
            if (date.type === 'pickup') {
                commit('SET_PICKUP', date.value)
                localStorage.setItem('pickup', date.value)
                return
            }

            commit('SET_DROPOFF', date.value)
            localStorage.setItem('dropoff', date.value)
        },

        registerUser({ commit, state }, user) {
            axios
                .post('http://api.vue-rentacar.localhost/api/auth/register', user)
                .then(response => {
                    console.log(response)
                })
        },

        logout({commit}) {
            commit('LOGOUT')
            router.push({ name: 'home' })
        },

        loginUser({ commit, state }, user) {
            axios
                .post('http://api.vue-rentacar.localhost/api/auth/login', user)
                .then(response => {
                    console.log(response)
                    commit('SET_TOKEN', response.data.token)
                    commit('SET_USER', response.data.user)

                    router.push({ name: 'Confirmation' })
                })
                .catch(error => {
                    commit('SET_INVALID_CREDENTIALS', '')
                    commit('SET_LOGIN_ERRORS', [])
                    console.log(error.response)

                    if(error.response.data.error) {
                        commit('SET_INVALID_CREDENTIALS', error.response.data.error)
                    } else {
                        const errors = []

                        for (const key of Object.keys(error.response.data.errors)) {
                            error.response.data.errors[key].forEach(err =>{
                                errors.push(err)
                            })
                        }

                        console.log(errors)

                        commit('SET_LOGIN_ERRORS', errors)
                    }
                })
        },

        makeReservation({ commit, state }, reservationData) {
            const authorization = {
                headers: {
                    Authorization: `Bearer ${this.state.token}`
                }
            }

            axios
                .post(
                    'http://api.vue-rentacar.localhost/create-reservation',
                    reservationData,
                    authorization
                )
                .then(response => {
                    console.log(response)
                })
                .catch(error => {
                    console.log(error)
                })
        }
    }
})
