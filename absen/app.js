/**
 * Absen Karyawan — App Logic
 * ======================================
 * Role admin: email harus ada di daftar "admin emails" (default: "admin@khizanatullah.github.io")
 * atau bisa diatur di variabel ADMIN_EMAILS di bawah.
 *
 * Data disimpan di localStorage:
 *  - "absen_users"  : [{ id, name, email, password, role, salary, createdAt }]
 *  - "absen_sessions": { "<email>": { loginAt } }  (bukan session server — hanya marker UI)
 *  - "absen_attendance": [{ id, userId, date, checkIn, checkOut, status, isLate, notes }]
 */

(function () {
  "use strict";

  // =============================
  // Konfigurasi
  // =============================

  // Email yang punya role ADMIN (pisahkan koma)
  var ADMIN_EMAILS = "admin@khizanatullah.github.io";

  // Jam batas
  var BATAS_DATANG = "07:15";   // sebelum/jam ini = tidak terlambat
  var BATAS_PULANG_SETENGAH = "14:00"; // pulang sebelum jam ini + datang tidak telat = setengah

  // Gaji referensi per hari (bisa diatur ulang di admin)
  var DEFAULT_FULL_SALARY = 100000;  // gaji penuh per hari (contoh)
  var DEFAULT_HALF_SALARY = 50000;   // gaji setengah hari

  // =============================
  // Helper
  // =============================

  function getUsers() {
    try { return JSON.parse(localStorage.getItem("absen_users") || "[]"); }
    catch (e) { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem("absen_users", JSON.stringify(users));
  }

  function getAttendance() {
    try { return JSON.parse(localStorage.getItem("absen_attendance") || "[]"); }
    catch (e) { return []; }
  }

  function saveAttendance(list) {
    localStorage.setItem("absen_attendance", JSON.stringify(list));
  }

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Hash sederhana (bukan enkripsi aman — cukup untuk proyek demoweb statis)
  // Gunakan SubtleCrypto jika ingin lebih aman, tapi tetap client-side.
  function hashStr(str) {
    // MD5-ish sederhana pakai.simpson saat ini cukup untuk demo; jangan pakai untuk data sensitif sungguhan.
    var md5 = function (input) {
      // implementasi mini MD5 (tanpa dependency)
      var hex_chr = "0123456789abcdef";
      var str = input;
      var len = str.length;
      var word_array = [];
      for (var i = 0; i < len; i++) {
        word_array.push(str.charCodeAt(i));
      }
      // pad
      var padlen = (56 - (len + 8)) % 64;
      if (padlen < 0) padlen += 64;
      for (var k = 0; k < padlen; k++) word_array.push(0);
      // length in bits as 64-bit little-endian
      var bit_len = len * 8;
      for (var j = 0; j < 8; j++) word_array.push(bit_len >> (j * 8) & 0xff);
      // MD5 transform
      var a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
      var f, g, temp;
      var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
      var S21 = 5,  S22 = 9,  S23 = 14, S24 = 20;
      var S31 = 4,  S32 = 11, S33 = 16, S34 = 23;
      var S41 = 6,  S42 = 10, S43 = 15, S44 = 21;
      var k = 0;
      var x = [];
      for (var i = 0; i < word_array.length; i += 16) {
        for (var j = 0; j < 16; j++) x[j] = word_array[i + j];
        var aa = a, bb = b, cc = c, dd = d;
        // round 1
        for (var j = 0; j < 16; j++) {
          f = (b & c) | ((~b) & d);
          g = j;
          temp = d; d = c; c = b; b = b + leftRotate((a + f + x[g] + 0xd76aa478), (S11 + j * 0)); // S11..S14 handled below
          // simpler: compute shift per step
          b = b << ((S11 + j * 0) % 32) | b >>> (32 - ((S11 + j * 0) % 32)); // placeholder — we'll fix below
        }
        // (omitted — implementasi MD5 lengkap terlalu panjang; gunakan CryptoJS atau Web Crypto API jika perlu)
        // SESUDAH ini, kita pakai approach lain: simple hash dengan btoa+charCodeAt
      }
      // Fallback: simple hash
      return simpleHash(input);
    };
    // Karena implementasi MD5 lengkap terlalu besar untuk file ini,
    // kita gunakan simple hash yang lebih aman daripada plain text untuk demo.
    return simpleHash(str);
  }

  function simpleHash(str) {
    // Simple hash: gabungkan char code dengan perkalian prime.
    // TIDAK aman untuk password produksi — hanya untuk demo proyek web statis.
    var hash = 0;
    var prime = 31;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    // Encode ke hex
    var hex = ("00000000" + (hash >>> 0).toString(16)).slice(-8);
    // tambah salt sederhana
    var salt = "absen_karyawan_salt_2024";
    var combined = hex + salt;
    var h2 = 0;
    for (var j = 0; j < combined.length; j++) {
      h2 = ((h2 << 5) - h2) + combined.charCodeAt(j);
      h2 |= 0;
    }
    return ("00000000" + (h2 >>> 0).toString(16)).slice(-8);
  }

  function timeToMinutes(t) {
    // "HH:MM" -> menit sejak tengah malam
    var parts = t.split(":");
    if (parts.length !== 2) return null;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ("0" + (d.getMonth() + 1)).slice(-2);
    var day = ("0" + d.getDate()).slice(-2);
    return y + "-" + m + "-" + day;
  }

  function timeNowStr() {
    var d = new Date();
    var h = ("0" + d.getHours()).slice(-2);
    var m = ("0" + d.getMinutes()).slice(-2);
    return h + ":" + m;
  }

  function isAdmin(email) {
    var admins = ADMIN_EMAILS.split(",").map(function (e) { return e.trim().toLowerCase(); });
    return admins.indexOf(email.trim().toLowerCase()) !== -1;
  }

  function getUserByEmail(email) {
    var users = getUsers();
    var e = email.trim().toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === e) return users[i];
    }
    return null;
  }

  function getAttendanceByUserDate(userId, date) {
    var list = getAttendance();
    for (var i = 0; i < list.length; i++) {
      if (list[i].userId === userId && list[i].date === date) return list[i];
    }
    return null;
  }

  function getAttendanceByUser(userId) {
    var list = getAttendance();
    var result = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].userId === userId) result.push(list[i]);
    }
    // sort terbaru di awal
    result.sort(function (a, b) { return b.date.localeCompare(a.date) || b.checkIn.localeCompare(a.checkIn); });
    return result;
  }

  function getThisWeekDates() {
    var dates = [];
    var d = new Date();
    var day = d.getDay(); // 0=Sun, 1=Mon...
    // start from Monday (day 1). If today is Sunday (0), shift to -6 days.
    var diff = day === 0 ? -6 : 1 - day;
    var monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    for (var i = 0; i < 5; i++) {
      var dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      var y = dd.getFullYear();
      var m = ("0" + (dd.getMonth() + 1)).slice(-2);
      var day = ("0" + dd.getDate()).slice(-2);
      dates.push(y + "-" + m + "-" + day);
    }
    return dates;
  }

  // =============================
  // Logika Gaji / Status Absensi
  // =============================

  /**
   * Hitung status & estimasi gaji untuk satu rekaman absensi.
   * @param {string} checkIn  format "HH:MM" (null jika belum absen masuk)
   * @param {string} checkOut format "HH:MM" (null jika belum absen keluar)
   * @returns {object} { status: string, salaryPercent: number, salaryNote: string }
   */
  function hitungStatus(checkIn, checkOut) {
    var result = {
      status: "belum_mulai",
      salaryPercent: 0,
      salaryNote: "Belum absen"
    };

    if (!checkIn) {
      result.status = "belum_mulai";
      result.salaryPercent = 0;
      result.salaryNote = "Belum datang";
      return result;
    }

    var mIn = timeToMinutes(checkIn);
    var lates = mIn > timeToMinutes(BATAS_DATANG); // datang setelah 07:15

    if (lates) {
      // Terlambat: tidak dapat gaji hari ini
      result.status = "terlambat";
      result.salaryPercent = 0;
      result.salaryNote = "Terlambat — tidak dapat gaji hari ini";
      return result;
    }

    // Datang tidak telat
    if (!checkOut) {
      // Belum pulang: status "hadir" tapi gaji belum bisa ditentukan (tunggu pulang)
      result.status = "hadir";
      result.salaryPercent = 0; // belum tahu
      result.salaryNote = "Belum pulang — tunggu absen pulang";
      return result;
    }

    var mOut = timeToMinutes(checkOut);

    if (mOut < timeToMinutes(BATAS_PULANG_SETENGAH)) {
      // Datang tidak telat + pulang sebelum 14:00 = setengah hari
      result.status = "hadir_setengah";
      result.salaryPercent = 50;
      result.salaryNote = "Setengah hari";
    } else {
      // Datang tidak telat + pulang >= 14:00 = penuh (asalkan datang <= 07:15 sudah diatas)
      result.status = "hadir_penuh";
      result.salaryPercent = 100;
      result.salaryNote = "Hari penuh";
    }
    return result;
  }

  /**
   * Hitung total gaji seminggu untuk satu user berdasarkan data absensi.
   * @param {object} user - user object (harus ada .salary = gaji penuh per hari, atau pakai default)
   * @param {array}  targetDates - array tanggal "YYYY-MM-DD" (misal 5 hari kerja)
   * @returns {{ total: number, breakdown: [{date, status, amount}], full: number, half: number, late: number }}
   */
  function hitungGajiMingguan(user, targetDates) {
    var attendanceList = getAttendance();
    var fullSalary = user && user.salary ? user.salary : DEFAULT_FULL_SALARY;
    var halfSalary = user && user.halfSalary ? user.halfSalary : DEFAULT_HALF_SALARY;

    var breakdown = [];
    var total = 0;
    var countFull = 0, countHalf = 0, countLate = 0, countMissing = 0;

    for (var i = 0; i < targetDates.length; i++) {
      var date = targetDates[i];
      var rek = null;
      for (var j = 0; j < attendanceList.length; j++) {
        if (attendanceList[j].userId === user.id && attendanceList[j].date === date) {
          rek = attendanceList[j];
          break;
        }
      }
      var info = rek ? hitungStatus(rek.checkIn, rek.checkOut) : { status: "belum_mulai", salaryPercent: 0, salaryNote: "Belum absen" };
      var amount = 0;
      if (info.status === "hadir_penuh") {
        amount = fullSalary;
        countFull++;
      } else if (info.status === "hadir_setengah") {
        amount = halfSalary;
        countHalf++;
      } else if (info.status === "terlambat") {
        amount = 0;
        countLate++;
      } else {
        countMissing++;
      }
      breakdown.push({ date: date, status: info.status, note: info.salaryNote, amount: amount });
      total += amount;
    }

    return {
      total: total,
      breakdown: breakdown,
      summary: {
        full: countFull,
        half: countHalf,
        late: countLate,
        missing: countMissing
      }
    };
  }

  // =============================
  // Auth (login / register)
  // =============================

  window.AbsenApp = {

    login: function (email, password) {
      var user = getUserByEmail(email);
      if (!user) {
        return { error: "Email tidak terdaftar. Silakan daftar dahulu." };
      }
      var storedHash = user.password;
      var inputHash = simpleHash(password); // gunakan hash sama seperti saat register
      if (storedHash !== inputHash) {
        return { error: "Password salah." };
      }
      // Set session (foreground-only, tanda tangan ui)
      try {
        var sessions = JSON.parse(localStorage.getItem("absen_sessions") || "{}");
        sessions[user.email] = { loginAt: nowISO() };
        localStorage.setItem("absen_sessions", JSON.stringify(sessions));
      } catch (e) {}
      return { ok: true, user: user };
    },

    register: function (name, email, password) {
      var users = getUsers();
      var e = email.trim().toLowerCase();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === e) {
          return { error: "Email sudah terdaftar." };
        }
      }
      if (!name || name.trim().length < 2) {
        return { error: "Nama wajib diisi (minimal 2 huruf)." };
      }
      if (password.length < 6) {
        return { error: "Password minimal 6 karakter." };
      }
      var roles = isAdmin(email) ? "admin" : "user";
      var newUser = {
        id: uuid(),
        name: name.trim(),
        email: e,
        password: simpleHash(password),
        role: roles,
        salary: DEFAULT_FULL_SALARY,
        halfSalary: DEFAULT_HALF_SALARY,
        createdAt: nowISO()
      };
      users.push(newUser);
      saveUsers(users);
      // auto-login after register
      try {
        var sessions = JSON.parse(localStorage.getItem("absen_sessions") || "{}");
        sessions[newUser.email] = { loginAt: nowISO() };
        localStorage.setItem("absen_sessions", JSON.stringify(sessions));
      } catch (e) {}
      return { ok: true, user: newUser };
    },

    logout: function () {
      try {
        var sessions = JSON.parse(localStorage.getItem("absen_sessions") || "{}");
        var currentUser = this.currentUser();
        if (currentUser && sessions[currentUser.email]) {
          delete sessions[currentUser.email];
          localStorage.setItem("absen_sessions", JSON.stringify(sessions));
        }
      } catch (e) {}
      // hapus marker UI
      localStorage.removeItem("absen_current_user");
      window.location.href = "index.html";
    },

    currentUser: function () {
      var email = localStorage.getItem("absen_current_user");
      if (!email) return null;
      return getUserByEmail(email);
    },

    setCurrentUser: function (email) {
      localStorage.setItem("absen_current_user", email.trim().toLowerCase());
    },

    // =============================
    // Absensi
    // =============================

    checkIn: function (userId) {
      var today = todayStr();
      var existing = getAttendanceByUserDate(userId, today);
      if (existing && existing.checkIn) {
        return { error: "Anda sudah absen datang hari ini (pukul " + existing.checkIn + ")." };
      }
      var now = timeNowStr();
      var record = {
        id: uuid(),
        userId: userId,
        date: today,
        checkIn: now,
        checkOut: null,
        status: "pending",
        isLate: timeToMinutes(now) > timeToMinutes(BATAS_DATANG),
        notes: ""
      };
      var list = getAttendance();
      // Hapus rekaman lama kalau ada (overwrite)
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === record.id) {
          list.splice(i, 1);
          break;
        }
      }
      list.push(record);
      saveAttendance(list);
      return { ok: true, record: record };
    },

    checkOut: function (userId) {
      var today = todayStr();
      var existing = getAttendanceByUserDate(userId, today);
      if (!existing || !existing.checkIn) {
        return { error: "Anda belum absen datang hari ini. Tekan DATANG dahulu." };
      }
      if (existing.checkOut) {
        return { error: "Anda sudah absen pulang hari ini (pukul " + existing.checkOut + ")." };
      }
      var now = timeNowStr();
      existing.checkOut = now;
      var info = hitungStatus(existing.checkIn, existing.checkOut);
      existing.status = info.status;
      existing.isLate = info.status === "terlambat";
      existing.salaryPercent = info.salaryPercent;
      existing.salaryNote = info.salaryNote;
      // Simpan lagi
      var list = getAttendance();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === existing.id) {
          list[i] = existing;
          break;
        }
      }
      saveAttendance(list);
      return { ok: true, record: existing };
    },

    getTodayRecord: function (userId) {
      var today = todayStr();
      return getAttendanceByUserDate(userId, today);
    },

    // =============================
    // Admin: data karyawan & gaji
    // =============================

    getAllUsers: function () {
      return getUsers();
    },

    setUserSalary: function (userId, fullSalary, halfSalary) {
      var users = getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
          if (fullSalary !== undefined && fullSalary !== null) users[i].salary = Number(fullSalary) || 0;
          if (halfSalary !== undefined && halfSalary !== null) users[i].halfSalary = Number(halfSalary) || 0;
          saveUsers(users);
          return { ok: true, user: users[i] };
        }
      }
      return { error: "User tidak ditemukan." };
    },

    updateUserRole: function (userId, role) {
      role = role === "admin" ? "admin" : "user";
      var users = getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
          users[i].role = role;
          saveUsers(users);
          return { ok: true, user: users[i] };
        }
      }
      return { error: "User tidak ditemukan." };
    },

    addUser: function (name, email, password, role, fullSalary, halfSalary) {
      var users = getUsers();
      var e = email.trim().toLowerCase();
      for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === e) {
          return { error: "Email sudah terdaftar." };
        }
      }
      if (!name || name.trim().length < 2) {
        return { error: "Nama wajib diisi." };
      }
      if (password.length < 6) {
        return { error: "Password minimal 6 karakter." };
      }
      var newUser = {
        id: uuid(),
        name: name.trim(),
        email: e,
        password: simpleHash(password),
        role: (role === "admin" && isAdmin(email)) ? "admin" : "user",
        salary: Number(fullSalary) || DEFAULT_FULL_SALARY,
        halfSalary: Number(halfSalary) || DEFAULT_HALF_SALARY,
        createdAt: nowISO()
      };
      users.push(newUser);
      saveUsers(users);
      return { ok: true, user: newUser };
    },

    deleteUser: function (userId) {
      var users = getUsers();
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === userId) {
          var removed = users.splice(i, 1)[0];
          saveUsers(users);
          // hapus juga attendance
          var att = getAttendance();
          for (var j = att.length - 1; j >= 0; j--) {
            if (att[j].userId === userId) att.splice(j, 1);
          }
          saveAttendance(att);
          return { ok: true, removed: removed };
        }
      }
      return { error: "User tidak ditemukan." };
    },

    // reset data (hanya kalau perlu testing ulang)
    resetAllData: function () {
      localStorage.removeItem("absen_users");
      localStorage.removeItem("absen_attendance");
      localStorage.removeItem("absen_sessions");
      localStorage.removeItem("absen_current_user");
      return { ok: true };
    }
  };

})();
