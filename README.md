# Vote3.id - Decentralized Gasless E-Voting Platform 🗳️✨

Vote3.id adalah platform pemungutan suara elektronik (E-Voting) berbasis teknologi Web3 (blockchain) yang dirancang agar **aman**, **transparan**, **imutabel (tidak dapat diubah)**, dan **mudah digunakan tanpa perlu memahami Web3/wallet kripto**.

Aplikasi ini menggunakan pendekatan **Gasless Voting via Relayer** di mana pemilih tidak memerlukan wallet pribadi (seperti MetaMask) dan tidak perlu membayar biaya transaksi (gas fee). Keunikan suara dijamin dengan melakukan hashing **Keccak256** pada NIK pemilih secara aman di sisi browser sebelum dikirimkan ke blockchain.

---

## 🚀 Fitur Utama

1.  **Gasless Voting (Tanpa Wallet & Tanpa Gas Fee)**:
    Pemilih cukup memasukkan NIK dan memilih kandidat. Transaksi ke blockchain akan ditandatangani dan dibiayai oleh wallet operator/relayer yang terintegrasi secara aman.
2.  **Keamanan & Privasi NIK (1 NIK = 1 Vote)**:
    NIK pemilih tidak pernah disimpan dalam bentuk teks biasa di blockchain. Frontend akan mengubah NIK menjadi hash kriptografi `Keccak256(NIK)` terlebih dahulu untuk validasi keunikan suara di smart contract.
3.  **Dukungan Multi-Event**:
    Admin dapat menutup pemilu yang berjalan dan memulai pemilu baru. Setelah event pemilu baru dimulai, pemilih dengan NIK yang sama dapat memberikan suara kembali secara terisolasi pada event yang baru.
4.  **UI/UX Premium & Modern**:
    Antarmuka bertema gelap (*dark mode*) yang memukau dengan efek *glassmorphism*, visualisasi persentase real-time, dashboard pemilih yang intuitif, serta Panel Admin khusus.
5.  **Mode Simulasi (Fallback)**:
    Jika blockchain lokal tidak terdeteksi, aplikasi secara cerdas masuk ke **Mode Simulasi (Offline)** sehingga seluruh UI tetap interaktif dan dapat didemonstrasikan dengan mock-data.

---

## 🛠️ Tech Stack

*   **Smart Contracts & Backend**:
    *   Solidity (^0.8.20)
    *   Hardhat (Framework Development & Testing)
    *   Ethers.js v6 (Interaksi Blockchain)
*   **Frontend**:
    *   React.js (Vite)
    *   TypeScript
    *   Tailwind CSS v4 (Styling)
    *   Lucide Icons (Ikonografi Modern)

---

## 📁 Struktur Folder

```text
├── contracts/             # Kode sumber smart contract & Hardhat config
│   ├── src/               # Kode Solidity (.sol)
│   │   ├── Voting.sol     # Implementasi utama contract
│   │   └── interfaces/    # Interface, Events, & Custom Errors
│   ├── test/              # Unit testing smart contract (.ts)
│   └── scripts/           # Script deployment
└── webapp/                # Kode sumber frontend React-Vite
    ├── src/               # Komponen React, CSS, & Logic
    │   ├── App.tsx        # UI Utama & Integrasi Web3
    │   └── index.css      # Konfigurasi Tailwind & Utility Styles
    └── .env               # Pengaturan environment variables (diabaikan oleh git)
```

---

## ⚙️ Cara Memulai (Local Setup)

### Prerequisites
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (Rekomendasi v18 ke atas).

### Langkah 1: Setup Smart Contract
1.  Masuk ke direktori `contracts`:
    ```bash
    cd contracts
    ```
2.  Instal dependensi:
    ```bash
    npm install
    ```
3.  Jalankan node blockchain lokal (Hardhat Network):
    ```bash
    npx hardhat node
    ```
    *Terminal ini akan berjalan secara aktif dan menampilkan daftar 20 akun beserta private key bawaan lokal.*

4.  Deploy smart contract ke jaringan lokal (di terminal baru dalam folder `contracts`):
    ```bash
    npx hardhat run scripts/deploy.ts --network localhost
    ```
    *Catat alamat contract yang muncul di layar (contoh: `0x5FbDB2315678afecb367f032d93F642f64180aa3`).*

### Langkah 2: Setup Frontend Webapp
1.  Masuk ke direktori `webapp`:
    ```bash
    cd ../webapp
    ```
2.  Instal dependensi:
    ```bash
    npm install
    ```
3.  Salin konfigurasi environment variable:
    Buat file bernama `.env` di dalam folder `webapp` (jika belum ada) dan sesuaikan nilainya:
    ```env
    VITE_RPC_URL=http://127.0.0.1:8545
    VITE_CONTRACT_ADDRESS=MASUKKAN_ALAMAT_KONTRAK_ANDA
    VITE_OPERATOR_PRIVATE_KEY=MASUKKAN_PRIVATE_KEY_AKUN_HARDHAT_0
    ```
4.  Jalankan frontend dalam mode development:
    ```bash
    npm run dev
    ```
5.  Buka browser dan akses **[http://localhost:5173/](http://localhost:5173/)**.

---

## 🧪 Pengujian Smart Contract

Untuk memastikan semua logika smart contract berjalan dengan aman (keberhasilan vote, pencegahan double vote, pembatasan admin), Anda dapat menjalankan unit test otomatis:
```bash
cd contracts
npx hardhat test
```

---

## 🔒 Lisensi

Project ini dilisensikan di bawah **MIT License**.
