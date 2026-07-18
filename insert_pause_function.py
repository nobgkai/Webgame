#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Python script to insert pauseGame() function into Mode_Hardcore.html

file_path = r'd:\web_nott\Webgame\Mode_Hardcore.html'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Code to insert
pause_game_code = '''
    // ===== PAUSE/STOP GAME FUNCTION =====
    function pauseGame() {
      state.paused = true;
      clearInterval(state.timer);
      
      Swal.fire({
        title: '⏸️ หยุดการเล่น',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ต่อเล่น',
        cancelButtonText: 'กลับหน้าแรก',
        confirmButtonColor: '#6FE3A8',
        cancelButtonColor: '#FF9FC3',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          // Continue playing
          state.paused = false;
          startTimer();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          // Go back to home
          window.location.href = 'index.html';
        } else {
          // If cancelled (X button), resume
          state.paused = false;
          startTimer();
        }
      });
    }

    // Event listener for stop button
    document.getElementById('stop-btn').addEventListener('click', pauseGame);

'''

# Find the insertion point (before "SOUND BUTTON" section)
search_string = '/* =========================================================\n   SOUND BUTTON\n========================================================= */'

if search_string in content:
    # Insert code before SOUND BUTTON section
    updated_content = content.replace(
        search_string,
        pause_game_code + '\n    ' + search_string
    )
    
    # Write the updated content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ สำเร็จ! โค้ด pauseGame() ถูกแทรกเข้าไปในไฟล์ Mode_Hardcore.html")
    print(f"📍 ตำแหน่ง: ก่อนส่วน SOUND BUTTON section")
else:
    print("❌ ไม่พบ SOUND BUTTON section ในไฟล์")
