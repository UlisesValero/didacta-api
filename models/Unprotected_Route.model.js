import mongoose from 'mongoose'

export const unprotectedRouteSchema = new mongoose.Schema({
    nombre: String
}, { timestamps: true})


export const unprotectedRouteModel = mongoose.model('UnprotectedRoute', unprotectedRouteSchema, 'unprotected_route')
