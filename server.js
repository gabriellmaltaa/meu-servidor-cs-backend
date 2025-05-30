// server.js
const express = require('express');
const gamedig = require('gamedig');
const cors = require('cors'); // Importante se o front-end e back-end estiverem em domínios diferentes

const app = express();
const port = process.env.PORT || 3000; // Boa prática para deploy

app.use(cors()); // Habilita o CORS para todas as rotas

// --- LISTA DOS SEUS SERVIDORES DE CS2 ---
const LISTA_DE_SERVIDORES = [
    // VERIFIQUE SE ESTE É O IP E PORTA CORRETOS DO SEU SERVIDOR NA NUVEM
    { host: '177.54.149.34', port: 27094 }, 
];
// -----------------------------------------

// Rota da API que o front-end vai chamar
app.get('/api/lobbies', async (req, res) => {
    // Cria uma "promessa" de consulta para cada servidor na lista
    const promises = LISTA_DE_SERVIDORES.map(server => 
        gamedig.query({
            type: 'cs2',
            host: server.host,
            port: server.port
        }).catch(error => { 
            // Se um servidor falhar, retornamos um estado 'Offline' para ele
            return {
                name: `Servidor em ${server.host}`,
                status: 'Offline',
                ip: server.host,
                port: server.port
            };
        })
    );

    // Espera todas as consultas terminarem
    const results = await Promise.all(promises);

    // Formata os resultados para o front-end
    const lobbiesStatus = results.map(state => {
        if (state.status === 'Offline') {
            return {
                name: state.name,
                status: 'Offline',
                locked: true,
                ip: state.ip,
                port: state.port,
                players: [],
                currentPlayers: 0,
                maxPlayers: 0,
                map: 'N/A'
            };
        }
        
        return {
            name: state.name,
            status: 'Online',
            locked: state.password,
            ip: state.connect.split(':')[0],
            port: state.connect.split(':')[1],
            players: state.players.map(p => ({ name: p.name })), 
            currentPlayers: state.players.length,
            maxPlayers: state.maxplayers,
            map: state.map
        };
    });

    res.json(lobbiesStatus);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor de status de lobbies rodando em http://localhost:${port}`);
});
