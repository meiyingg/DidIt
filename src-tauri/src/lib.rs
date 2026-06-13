// Shared entry point used by both desktop (main.rs) and mobile (mobile_entry_point).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // The system tray + minimize-to-tray are desktop-only: the `tauri::tray` and
    // `tauri::menu` modules are gated behind `#[cfg(desktop)]` in tauri and simply
    // don't exist on Android/iOS. So wire them up only on desktop, otherwise the
    // mobile build fails with "could not find `tray` in `tauri`".
    #[cfg(desktop)]
    let builder = {
        use tauri::{
            image::Image,
            menu::{MenuBuilder, MenuItemBuilder},
            tray::{TrayIconBuilder, TrayIconEvent},
            Manager, WindowEvent,
        };

        builder
            .setup(|app| {
                // ---------- System tray ----------
                let show_item = MenuItemBuilder::with_id("show", "显示 DidIt").build(app)?;
                let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;

                let tray_menu = MenuBuilder::new(app)
                    .items(&[&show_item, &quit_item])
                    .build()?;

                let tray_icon = Image::from_bytes(include_bytes!("../icons/icon.png"))?;

                TrayIconBuilder::new()
                    .icon(tray_icon)
                    .tooltip("DidIt · 做了么")
                    .menu(&tray_menu)
                    .on_menu_event(|app, event| match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::DoubleClick { .. } = event {
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;

                Ok(())
            })
            // ---------- Minimize-to-tray on close ----------
            .on_window_event(|window, event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the window from actually closing; hide it instead.
                    api.prevent_close();
                    let _ = window.hide();
                }
            })
    };

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
