export const th = {
    common: {
        dashboard: "ภาพรวมระบบ",
        projects: "โครงการ",
        income: "รายรับ/เอกสาร",
        expenses: "รายจ่าย",
        tasks: "งานที่ต้องทำ",
        storage: "คลังไฟล์",
        partners: "คู่ค้า/ช่าง",
        settings: "ตั้งค่า",
        team: "ทีมงาน",
        contracts: "สัญญาจ้าง",
        search: "ค้นหา...",
        edit: "แก้ไข",
        delete: "ลบ",
        add_new: "เพิ่มรายการ",
        remove: "นำออก",
        save: "บันทึก",
        cancel: "ยกเลิก",
        status: "สถานะ",
        view: "ดู",
        customers: "ลูกค้า",
        profile: "โปรไฟล์",
        edit_profile: "แก้ไขโปรไฟล์",
        personal_info: "ข้อมูลส่วนตัว",
        account_settings: "ตั้งค่าบัญชี",
        log_out: "ออกจากระบบ",
        confirm_logout: "คุณแน่ใจหรือไม่ที่จะออกจากระบบ?",
        loading: "กำลังโหลด...",
    },

    calendar: {
        title: "ปฏิทินองค์กร",
        subtitle: "ดูงานและกำหนดการจ่ายเงินในที่เดียว",
        all_events: "ทั้งหมด",
        payments: "งวดจ่าย",
        payment: "งวดจ่าย",
        due_date: "กำหนด",
        amount: "จำนวนเงิน",
        month: "เดือน",
        week: "สัปดาห์",
        today: "วันนี้",
    },

    partners: {
        title: "คู่ค้าและช่าง",
        subtitle: "จัดการรายชื่อช่าง ผู้รับเหมา และร้านวัสดุ",
        add_partner: "เพิ่มคู่ค้า",
        search_placeholder: "ค้นหาคู่ค้า...",
        tabs: {
            all: "ทั้งหมด",
            technician: "ช่าง",
            store: "ร้านค้า",
            contractor: "ผู้รับเหมา"
        },
        view_details: "ดูรายละเอียด",
        no_phone: "ไม่มีเบอร์โทร",
        no_location: "ไม่มีที่อยู่",
        empty: "ไม่พบข้อมูล"
    },

    notifications: {
        title: "การแจ้งเตือน",
        stay_updated: "ติดตามความเคลื่อนไหวล่าสุด",
        mark_all_read: "อ่านทั้งหมดแล้ว",
        alerts: {
            task_overdue: "งานล่าช้า",
            task_due_soon: "งานใกล้ถึงกำหนด",
            task_overdue_msg: "งานในโครงการ {project} ล่าช้าไป {days} วัน",
            task_due_today_msg: "งานในโครงการ {project} ครบกำหนดวันนี้",
            task_due_days_msg: "งานในโครงการ {project} จะครบกำหนดใน {days} วัน",

            payment_overdue: "ค้างชำระ",
            unpaid_expense: "ยอดรอจ่าย",
            expense_overdue_msg: "รายการนี้ค้างจ่ายมาแล้ว {days} วัน",
            expense_pending_msg: "รายการนี้รอการชำระมาแล้ว {days} วัน",

            installment_overdue: "งวดงานล่าช้า",
            installment_due_soon: "งวดงานใกล้ถึงกำหนด",
            installment_overdue_msg: "งวด '{description}' ของสัญญา {contract} ล่าช้าไป {days} วัน",
            installment_due_today_msg: "งวด '{description}' ของสัญญา {contract} ครบกำหนดวันนี้",
            installment_due_days_msg: "งวด '{description}' ของสัญญา {contract} จะครบกำหนดใน {days} วัน"
        },
        clear: "ล้าง",
        no_notifications: "ไม่มีการแจ้งเตือน",
        caught_up: "คุณติดตามครบแล้ว!",
        view_details: "ดูรายละเอียด",
        today: "วันนี้",
        yesterday: "เมื่อวาน",
        earlier: "ก่อนหน้านี้",
        material_delivery: "วัสดุมาส่งแล้ว",
        payment_overdue: "เกินกำหนดชำระเงิน",
        new_task: "ได้รับมอบหมายงานใหม่",
        budget_warning: "แจ้งเตือนงบประมาณ",
        system_update: "อัปเดตระบบ",
        tabs: {
            today: "วันนี้",
            yesterday: "เมื่อวาน",
            earlier: "ก่อนหน้านี้"
        }
    },
    team_settings: {
        invitation_link: "ลิงก์คำเชิญ",
        invitation_desc: "ส่งลิงก์นี้ให้ทีมงานเพื่อเข้าร่วมองค์กรอัตโนมัติ",
        copy: "คัดลอก",
        enable_link: "เปิดใช้งานลิงก์",
        enable_link_desc: "อนุญาตให้สมาชิกใหม่เข้าร่วมผ่านลิงก์",
        default_permissions: "สิทธิ์เริ่มต้น",
        default_role_desc: "เลือกตำแหน่งเริ่มต้นสำหรับสมาชิกใหม่ที่เข้าร่วมผ่านลิงก์",
        default_role: "ตำแหน่งเริ่มต้น",
        roles: {
            member: "Member (ดูและคอมเมนต์)",
            editor: "Editor (แก้ไขโครงการ)",
            admin: "Admin (เข้าถึงทั้งหมด)"
        },
        team_members: "สมาชิกในทีม",
        manage_members: "จัดการสมาชิกที่มีอยู่และบทบาทหน้าที่",
        active_members: "คุณมีสมาชิกที่ใช้งานอยู่ {{count}} คนในทีม",
        manage_team: "จัดการทีม",
        enter_team_name: "ระบุชื่อทีมใหม่:"
    },
    search: {
        title: "ผลการค้นหา",
        found_results: "พบ {{count}} รายการ สำหรับ \"{{query}}\"",
        enter_term: "ระบุคำค้นหา",
        search_hint: "ค้นหาโครงการ, งาน หรือสัญญาจ้าง",
        sections: {
            projects: "โครงการ",
            tasks: "งาน"
        },
        in_project: "ใน",
        no_results: "ไม่พบข้อมูล",
        adjust_terms: "ลองเปลี่ยนคำค้นหาใหม่"
    },
    profile: {
        fields: {
            name: "ชื่อ-นามสกุล",
            email: "อีเมล",
            phone: "เบอร์โทรศัพท์",
            role: "ตำแหน่ง"
        }
    },
    auth: {
        new_password: "รหัสผ่านใหม่",
        confirm_password: "ยืนยันรหัสผ่านใหม่",
        password_mismatch: "รหัสผ่านไม่ตรงกัน",
        password_length: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    },
    navbar: {
        home: "หน้าแรก",
        finance: "การเงิน",
        more: "อื่นๆ",
        about: "เกี่ยวกับแอป",
        policy: "ข้อตกลงและนโยบาย",
        bored: "เบื่อเหรอ?",
        quick_add: "เพิ่มรายการด่วน",
        more_utils: "เมนูเพิ่มเติม",
        project: "โครงการ",
    },
    finance: {
        income: "รายรับ",
        expense: "รายจ่าย",
        quotation: "ใบเสนอราคา",
        invoice: "ใบแจ้งหนี้",
        receipt: "ใบเสร็จรับเงิน",
        all_items: "ทั้งหมด",
        manage_docs: "จัดการใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จรับเงิน",
    },
    projects: {
        my_projects: "โครงการของฉัน",
        new_project: "สร้างโครงการใหม่",
        create_project: "สร้างโครงการ",
        manage_projects: "จัดการโครงการก่อสร้างของคุณ",
        search_placeholder: "ค้นหาโครงการ...",
        filter: "ตัวกรอง",
        customer: "ลูกค้า",
        budget: "งบประมาณ",
        cost_value: "ต้นทุน / มูลค่า",
        due: "กำหนดส่ง",
        status: {
            all: "ทั้งหมด",
            in_progress: "กำลังดำเนินการ",
            completed: "เสร็จสิ้น",
            on_hold: "พักโครงการ",
            planning: "อยู่ระหว่างการวางแผน"
        },
        empty: "ไม่พบโครงการที่ตรงกับเงื่อนไข",
        edit: {
            title: "แก้ไขโครงการ",
            subtitle: "อัปเดตรายละเอียดโครงการ",
            fields: {
                name: "ชื่อโครงการ",
                customer: "ลูกค้า",
                location: "สถานที่",
                status: "สถานะ",
                desc: "รายละเอียด",
                start_date: "วันที่เริ่ม",
                end_date: "วันที่สิ้นสุด",
                budget: "งบประมาณ (ประมาณการ)",
                income: "รายรับ / เบิกเงิน",
                expenses: "รายจ่าย / ต้นทุน",
                image: "รูปภาพหน้าปก" // Cover Image
            },
            placeholders: {
                name: "เช่น ก่อสร้างอาคารสำนักงาน",
                location: "ที่อยู่สถานที่ก่อสร้าง",
                desc: "รายละเอียดขอบเขตงานโดยสังเขป...",
                select_customer: "เลือกลูกค้า"
            },
            sections: {
                details: "รายละเอียดโครงการ",
                timeline: "ระยะเวลา & งบประมาณ",
                image: "รูปภาพหน้าปก"
            },
            upload_area: {
                title: "คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง",
                subtitle: "รองรับ SVG, PNG, JPG หรือ GIF (สูงสุด 3MB)"
            }
        },
        detail: {
            tabs: {
                overview: "ภาพรวม",
                financials: "การเงิน",
                tasks: "งาน",
                files: "ไฟล์",
                sub_projects: "โปรเจคย่อย"
            },
            overview: {
                details: "ข้อมูลโครงการ",
                description: "รายละเอียดโครงการ",
                no_desc: "ไม่มีรายละเอียดสำหรับโครงการนี้",
                timeline: "ระยะเวลา & สถานะ",
                start_date: "วันที่เริ่ม",
                end_date: "สิ้นสุด (โดยประมาณ)",
                current_status: "สถานะปัจจุบัน"
            },
            financials: {
                contract_value: "มูลค่าสัญญา",
                received: "เบิกแล้ว",
                total_expenses: "รายจ่ายรวม",
                profit_est: "กำไร (ประมาณการ)",
                material: "ค่าวัสดุ",
                labor: "ค่าแรง",
                subcontract: "ค่าเหมา",
                history: "ประวัติการเงิน",
                add_expense: "เพิ่มรายจ่าย",
                no_expenses: "ยังไม่มีรายการรายจ่ายในโครงการนี้",
                transactions: "รายการ",
                transactions_count: "รายการ",
                no_payee: "ไม่ระบุชื่อผู้รับเงิน",
                empty_expenses: "ยังไม่มีรายการรายจ่ายในโครงการนี้",
                month_filter: "ทุกเดือน"
            },
            tasks: {
                add_task: "เพิ่มงาน",
                all_users: "ผู้รับผิดชอบทั้งหมด",
                empty: "ว่าง",
                quick_add: "เพิ่มงานใหม่",
                unassigned: "ไม่ได้มอบหมาย",
                status: {
                    todo: "รอทำ",
                    in_progress: "กำลังทำ",
                    done: "เสร็จสิ้น"
                },
                priority: {
                    low: "ต่ำ",
                    medium: "ปานกลาง",
                    high: "สูง"
                }
            },
            files: {
                title: "ไฟล์โครงการ",
                upload: "อัปโหลดไฟล์",
                no_files: "ไม่มีไฟล์",
                no_files_sub: "อัปโหลดแบบแปลน สัญญา หรือรูปภาพสำหรับโครงการนี้",
                enter_name: "ระบุชื่อไฟล์:",
                enter_file_name: "ระบุชื่อไฟล์:"
            },
            header: {
                client: "ลูกค้า",
                cost_paid: "ต้นทุนจ่ายจริง / มูลค่าหน้างาน",
                edit_project: "แก้ไขโครงการ",
                delete_project: "ลบโครงการ",
                confirm_delete: "คุณแน่ใจหรือไม่ที่จะลบโครงการนี้?"
            }
        }
    },
    dashboard: {
        total_revenue: "รายรับรวม",
        total_expenses: "รายจ่ายรวม",
        net_profit: "กำลังสุทธิ",
        active_projects: "โครงการที่ดำเนินการอยู่",
        download_report: "ดาวน์โหลดรายงาน",
        cash_flow: "กระแสเงินสด",
        my_work: "งานของฉัน",
        personal: "ส่วนตัว",
        greeting_morning: "สวัสดีตอนเช้า",
        greeting_afternoon: "สวัสดีตอนบ่าย",
        greeting_evening: "สวัสดีตอนเย็น",
        personal_overview: "นี่คือภาพรวมของคุณสำหรับวันนี้",
        quick_stats: "สถิติด่วน",
        pending_tasks: "งานที่ค้างอยู่",
        this_week: "สัปดาห์นี้",
        my_tasks: "งานของฉัน",
        pending_tasks_count: "คุณมี {{count}} งานที่ค้างอยู่",
        view_all: "ดูทั้งหมด",
        no_active_tasks: "ไม่มีงานที่มอบหมายให้คุณ",
        activity_feed: "ความเคลื่อนไหวล่าสุด",
        filters: {
            all_projects: "ทุกโครงการ",
            all_users: "ทุกคน"
        },
        no_activity: "ไม่พบกิจกรรมตามตัวกรองนี้"
    },
    expenses: {
        title: "รายจ่าย",
        subtitle: "ติดตามและจัดการต้นทุนโครงการ",
        create_contract: "สร้างสัญญา",
        add_expense: "เพิ่มรายจ่าย",
        manual_entry: "กรอกเอง",
        smart_scan: "สแกนบิล AI",
        unpaid: "ยกเลิก / Cancel",
        advanced: "สำรองจ่าย",
        credit: "เครดิต/ต้องชำระ",
        categories: {
            all: "ทั้งหมด",
            material: "วัสดุ",
            labor: "ค่าแรง",
            subcontract: "เหมาช่วง",
            other: "อื่นๆ"
        },
        filters: {
            all_months: "ทุกเดือน",
            all_status: "ทุกสถานะ",
            all_projects: "ทุกโครงการ",
            all_users: "ทุกคน",
            search_placeholder: "ค้นหารายจ่าย..."
        },
        sort: {
            label: "เรียงตาม",
            created: "วันที่สร้าง (ใหม่สุด)",
            date: "วันที่บิล",
            alphabetical: "ตัวอักษร (ก-ฮ)"
        },
        empty: "ไม่พบรายการรายจ่าย",
        empty_hint: "ลองปรับตัวกรองหรือเพิ่มรายจ่ายใหม่",
        dialog: {
            title: "บันทึกรายจ่าย",
            subtitle: "บันทึกการชำระเงิน, บิล, หรือใบแจ้งหนี้",
            bill_title: "ชื่อรายการ",
            bill_placeholder: "เช่น ซื้อวัสดุก่อสร้าง",
            date: "วันที่",
            category: "หมวดหมู่",
            payee: "ร้านค้า / ผู้รับเงิน",
            payee_labor: "คนงาน / ช่าง",
            select_vendor: "เลือกร้านค้า...",
            select_person: "เลือกคนงาน...",
            add_new_person: "+ เพิ่มคนงานใหม่...",
            add_new_vendor: "+ เพิ่มร้านค้าใหม่...",
            bill_assignment: "การระบุโครงการ",
            combine_bill: "รวมบิล (โครงการเดียว)",
            split_bill: "แยกรายการ (หลายโครงการ)",
            project: "โครงการ",
            task: "โปรเจคย่อย",
            add_new_sub_project: "+ เพิ่มโปรเจคย่อยใหม่...",
            item_breakdown: "รายการย่อย",
            vat_included: "ราคารวม VAT (7%)",
            add_line_item: "เพิ่มรายการ",
            subtotal: "รวมเป็นเงิน",
            vat: "ภาษีมูลค่าเพิ่ม",
            grand_total: "ยอดสุทธิ",
            payment_status: "สถานะการจ่าย",
            paid_by: "สำรองจ่ายโดย",
            vendor: "เจ้าหนี้ (Vendor)",
            receipt_image: "ใบเสร็จ / รูปภาพ",
            upload_hint: "คลิกเพื่ออัปโหลดใบเสร็จ",
            save: "บันทึกรายจ่าย",
            cancel: "ยกเลิก",
            item_desc: "รายละเอียดสินค้า/บริการ",
            quantity: "จำนวน",
            unit_price: "ราคาต่อหน่วย",
            quick_add: "เพิ่มข้อมูลใหม่"
        }
    },
    tasks: {
        title: "งานที่ต้องทำ",
        subtitle: "จัดการงานและการมอบหมายในทุกโครงการ",
        new_task: "สร้างงานใหม่",
        add_task: "เพิ่มงาน",
        search_placeholder: "ค้นหางานหรือโครงการ...",
        filters: {
            all_projects: "ทุกโครงการ",
            all_users: "ทุกคน"
        },
        status: {
            todo: "สิ่งที่ต้องทำ",
            in_progress: "กำลังทำ",
            done: "เสร็จสิ้น"
        },

        empty: "ไม่มีงาน",
        priority: {
            high: "สูง",
            medium: "ปานกลาง",
            low: "ต่ำ"
        },
        dialog: {
            title: "สร้างงานใหม่",
            subtitle: "มอบหมายงานใหม่ให้กับทีม",
            task_title: "ชื่องาน",
            title_placeholder: "งานที่ต้องทำคืออะไร?",
            assign_project: "ระบุโครงการ",
            select_project: "เลือกโครงการ",
            priority: "ความสำคัญ",
            due_date: "กำหนดส่ง",
            assignee: "ผู้รับผิดชอบ",
            unassigned: "ไม่ระบุ",
            create: "สร้างงาน"
        },
        no_date: "ไม่ระบุวัน",
        unassigned: "ไม่ได้มอบหมาย"
    },
    income: {
        title: "รายรับ",
        subtitle: "จัดการใบเสนอราคา ใบวางบิล และใบเสร็จรับเงิน",
        add_new: "เพิ่มรายการ",
        tabs: {
            all: "ทั้งหมด",
            quotation: "ใบเสนอราคา",
            invoice: "ใบแจ้งหนี้",
            receipt: "ใบเสร็จรับเงิน"
        },
        filters: {
            all_projects: "ทุกโครงการ",
            all_months: "ทุกเดือน",
            all_customers: "ลูกค้าทั้งหมด",
            all_techs: "ช่างทุกคน",
            search_placeholder: "ค้นหาเลขที่เอกสาร หรือ ลูกค้า..."
        },
        sort: {
            label: "เรียงตาม",
            created: "วันที่สร้าง (ใหม่สุด)",
            date: "วันที่เอกสาร",
            alphabetical: "ชื่อลูกค้า (ก-ฮ)"
        },
        table: {
            no: "เลขที่",
            type: "ประเภท",
            customer_project: "ลูกค้า / โครงการ",
            date: "วันที่",
            total: "ยอดรวม",
            status: "สถานะ"
        },
        empty: "ไม่พบเอกสารที่ตรงกับเงื่อนไข",
        dialog: {
            title: "สร้างรายการรายรับ",
            subtitle: "สร้างรายการรายรับใหม่",
            edit: "แก้ไข",
            new: "ใหม่",
            save: "บันทึก",
            select_customer: "เลือกลูกค้า",
            create_customer: "+ สร้างลูกค้าใหม่",
            select_project: "เลือกโครงการ",
            create_project: "+ สร้างโครงการใหม่",
            mode_simple_desc: "ทั่วไป (รวมรายการ)",
            mode_zone_desc: "โซน (แยกตามพื้นที่)",
            zone_name_placeholder: "ชื่อโซน (เช่น ห้องนั่งเล่น)",
            add_zone: "เพิ่มโซนใหม่",
            tabs: {
                simple: "ทั่วไป",
                zone: "โซน"
            },
            sections: {
                document_details: "รายละเอียดเอกสาร",
                tax_settings: "ตั้งค่าภาษี",
                items: "รายการสินค้า/บริการ",
                summary: "สรุปยอด",
                additional_info: "ข้อมูลเพิ่มเติม"
            },
            fields: {
                doc_type: "ประเภทเอกสาร",
                doc_no: "เลขที่เอกสาร",
                ref_no: "เลขที่อ้างอิง",
                date: "วันที่",
                project: "โครงการ",
                customer: "ลูกค้า",
                tax_type: "ประเภทภาษี",
                tax_rate: "อัตราภาษี",
                wht: "ภาษีหัก ณ ที่จ่าย"
            },
            items: {
                add: "เพิ่มรายการ",
                name: "ชื่อรายการ",
                desc: "รายละเอียด",
                qty: "จำนวน",
                price: "ราคาต่อหน่วย",
                unit: "หน่วย",
                total: "รวม",
                zone: "โซน",
                section: "ส่วน",
                block: "บล็อก",
                unit_info: "ข้อมูลหน่วย"
            },
            summary: {
                subtotal: "รวมเป็นเงิน",
                discount: "ส่วนลด",
                tax: "ภาษีมูลค่าเพิ่ม",
                grand_total: "จำนวนเงินรวมทั้งสิ้น",
                wht: "ภาษีหัก ณ ที่จ่าย",
                net_total: "ยอดชำระสุทธิ"
            },
            notes: {
                label: "หมายเหตุ",
                placeholder: "บันทึกเพิ่มเติม...",
            },
            payment_terms: {
                label: "เงื่อนไขการชำระเงิน",
                placeholder: "เช่น เครดิต 30 วัน"
            },
            footer: {
                cancel: "ยกเลิก",
                create: "สร้างรายการ"
            },
            doc_types: {
                quotation: "ใบเสนอราคา",
                invoice: "ใบแจ้งหนี้",
                receipt: "ใบเสร็จรับเงิน"
            }
        }
    },
    settings: {
        title: "ตั้งค่า",
        subtitle: "จัดการการตั้งค่าองค์กรและรูปแบบเอกสาร",
        menu: {
            company: "ข้อมูลบริษัท",
            documents: "เอกสาร",
            notifications: "แจ้งเตือน",
            team: "ทีมและตำแหน่ง",
            security: "ความปลอดภัย",
            data: "จัดการข้อมูล",
            theme: "ธีมแอปพลิเคชัน",
            telegram: "Telegram"
        },
        telegram: {
            title: "การแจ้งเตือน Telegram",
            subtitle: "เชื่อมต่อ Telegram Bot เพื่อรับการแจ้งเตือนทางแชท",
            setup_guide: "วิธีสร้าง Telegram Bot",
            setup_step1: "เปิด Telegram และค้นหา @BotFather",
            setup_step2: "พิมพ์ /newbot และทำตามขั้นตอน",
            setup_step3: "คัดลอก Bot Token ที่ได้รับ",
            setup_step4: "เพิ่ม Bot เข้ากลุ่มที่ต้องการรับแจ้งเตือน",
            setup_step5: "ค้นหา Chat ID โดยใช้ @RawDataBot",
            open_botfather: "เปิด BotFather",
            find_chatid: "หา Chat ID",
            config_title: "การตั้งค่า Bot",
            config_desc: "ใส่ข้อมูล Bot Token และ Chat ID ของคุณ",
            bot_token: "Bot Token",
            chat_id: "Chat ID",
            chat_id_hint: "Chat ID ของกลุ่ม (ขึ้นต้นด้วย -100 สำหรับ supergroup)",
            test_conn: "ทดสอบการเชื่อมต่อ",
            types_title: "ประเภทการแจ้งเตือน",
            types_desc: "เลือกประเภทการแจ้งเตือนที่ต้องการรับ",
            notify_expense: "แจ้งเตือนเมื่อสร้างรายจ่าย",
            notify_expense_desc: "รับแจ้งเตือนทันทีเมื่อมีการสร้างรายจ่ายใหม่",
            notify_quotation: "แจ้งเตือนเมื่อสร้างใบเสนอราคา",
            notify_quotation_desc: "รับแจ้งเตือนเมื่อมีการสร้างใบเสนอราคาใหม่",
            notify_payment: "แจ้งเตือนครบกำหนดชำระ",
            notify_payment_desc: "รับแจ้งเตือนเมื่อใกล้ครบกำหนดชำระเงิน",
            days_advance: "แจ้งล่วงหน้า (วัน)",
            save_btn: "บันทึกการตั้งค่า",
            save_success: "บันทึกการตั้งค่าเรียบร้อย",
            test_success: "ส่งข้อความทดสอบสำเร็จ!"
        },
        company: {
            title: "ข้อมูลบริษัทของคุณ",
            subtitle: "ข้อมูลนี้จะปรากฏบนเอกสารของคุณ",
            change_logo: "เปลี่ยนโลโก้",
            fields: {
                name: "ชื่อบริษัท / ร้านค้า",
                tax_id: "เลขประจำตัวผู้เสียภาษี",
                address: "ที่อยู่",
                phone: "เบอร์โทรศัพท์",
                email: "อีเมล",
                website: "เว็บไซต์"
            },
            placeholders: {
                name: "ตัวอย่าง บริษัท จำกัด",
                tax_id: "0000000000000",
                address: "บ้านเลขที่ ถนน แขวง เขต...",
                phone: "02-xxx-xxxx",
                email: "contact@company.com",
                website: "https://..."
            }
        },
        theme: {
            title: "รูปลักษณ์",
            color: "สีธีม",
            font: "แบบอักษร",
            mode: "โหมดอินเตอร์เฟซ",
            mode_light: "สว่าง",
            mode_dark: "มืด",
            mode_system: "ระบบ",
            roundness: "ความโค้งมน",
            roundness_desc: "ปรับรูปร่างปุ่มและการ์ด",
            roundness_sharp: "เหลี่ยม",
            roundness_round: "มน",
            roundness_standard: "มาตรฐาน",
            reset: "รีเซ็ต",
            save: "บันทึกการเปลี่ยนแปลง",
            saved: "บันทึกแล้ว!",
            global_hint: "การเปลี่ยนแปลงจะมีผลทั่วทั้งแอปพลิเคชัน"
        },
        data: {
            title: "จัดการข้อมูล",
            subtitle: "สำรองข้อมูลของคุณหรือกู้คืนจากไฟล์สำรอง",
            backup: {
                title: "สำรองข้อมูล",
                desc: "ดาวน์โหลดสำเนาของโครงการ ค่าใช้จ่าย และการตั้งค่าทั้งหมดลงในคอมพิวเตอร์ของคุณ",
                button: "ส่งออก JSON",
                last_backup: "สำรองข้อมูลล่าสุด: ไม่เคย"
            },
            restore: {
                title: "กู้คืนข้อมูล",
                desc: "กู้คืนข้อมูลของคุณจากไฟล์สำรอง JSON",
                warning: "คำเตือน: การกระทำนี้จะแทนที่ข้อมูลปัจจุบันทั้งหมด",
                button: "กู้คืนจากไฟล์สำรอง",
                button_restoring: "กำลังกู้คืน...",
                supported: "รูปแบบที่รองรับ: .json"
            },
            important: {
                title: "ข้อควรระวัง",
                desc: "เนื่องจากแอปนี้ทำงานแบบออฟไลน์ ข้อมูลของคุณจะถูกเก็บไว้ในเบราว์เซอร์นี้ การล้าง \"ข้อมูลไซต์\" หรือ \"แคช\" ของเบราว์เซอร์จะทำให้ข้อมูลหายไป โปรดหมั่นสำรองข้อมูลเป็นประจำ"
            },
            messages: {
                success_backup: "ดาวน์โหลดไฟล์สำรองเรียบร้อยแล้ว",
                error_backup: "ไม่สามารถสร้างไฟล์สำรองได้",
                invalid_type: "ชนิดไฟล์ไม่ถูกต้อง โปรดอัปโหลดไฟล์สำรอง JSON",
                confirm_restore: "คำเตือน: การกระทำนี้จะแทนที่ข้อมูลปัจจุบันทั้งหมดด้วยข้อมูลสำรอง และไม่สามารถยังเลิกได้ คุณแน่ใจหรือไม่?",
                success_restore: "กู้คืนข้อมูลสำเร็จ! แอปจะรีโหลดใหม่",
                error_restore: "กู้คืนข้อมูลไม่สำเร็จ ดูรายละเอียดในคอนโซล",
                error_parse: "อ่านไฟล์สำรองไม่สำเร็จ ไฟล์ JSON ถูกต้องหรือไม่?"
            }
        },
        security: {
            title: "ความปลอดภัย",
            subtitle: "ปกป้องข้อมูลของคุณด้วยรหัส PIN",
            lock: {
                title: "ล็อคแอป",
                enabled: "เปิดใช้งานแล้ว (ตั้งรหัส PIN แล้ว)",
                disabled: "ปิดใช้งาน (ยังไม่ตั้ง PIN)",
                enable_btn: "เปิดใช้งานล็อค",
                change_btn: "เปลี่ยนรหัส PIN"
            },
            form: {
                current_pin: "รหัส PIN ปัจจุบัน",
                new_pin: "รหัส PIN ใหม่",
                confirm_pin: "ยืนยันรหัส PIN",
                save: "บันทึก PIN",
                update: "อัปเดต PIN",
                cancel: "ยกเลิก",
                placeholder: "กรอกตัวเลข 4-6 หลัก"
            },
            disable: {
                btn: "ปิดใช้งานล็อคแอป",
                title: "ปิดใช้งานความปลอดภัย?",
                desc: "ใครก็ตามที่เข้าถึงอุปกรณ์นี้จะสามารถดูข้อมูลของคุณได้",
                confirm_btn: "ปิดใช้งานล็อค"
            },
            messages: {
                length_error: "รหัส PIN ต้องมีอย่างน้อย 4 หลัก",
                match_error: "รหัส PIN ไม่ตรงกัน",
                success_set: "ตั้งรหัส PIN สำเร็จ",
                verify_error: "รหัส PIN ปัจจุบันไม่ถูกต้อง",
                success_update: "อัปเดตรหัส PIN สำเร็จ",
                success_disable: "ปิดใช้งานการล็อคแอปแล้ว"
            }
        },
        notifications: {
            title: "การตั้งค่าการแจ้งเตือน",
            warning_days_task: "แจ้งเตือนงานล่วงหน้า (วัน)",
            warning_days_expense: "แจ้งเตือนรายจ่ายล่วงหน้า (วัน)",
            warning_desc: "ต้องการให้แจ้งเตือนล่วงหน้ากี่วันก่อนถึงกำหนด?",
            overdue: "แจ้งเตือนเกินกำหนด",
            overdue_desc: "รับการแจ้งเตือนทันทีเมื่อรายการเกินกำหนด",
            assignments: "การมอบหมายงาน",
            assignments_desc: "รับการแจ้งเตือนเมื่อคุณได้รับมอบหมายงานใหม่",
            push_title: "การแจ้งเตือนแบบพุช",
            push_desc: "รับการแจ้งเตือนแบบพุชบนอุปกรณ์ของคุณ",
            enable_push: "เปิดใช้งานการแจ้งเตือนแบบพุช"
        },
        documents: {
            setup_title: "ตั้งค่าเทมเพลตด้วย AI",
            setup_desc: "อัปโหลดตัวอย่างเอกสารที่มีอยู่ (PDF/รูปภาพ) AI ของเราจะวิเคราะห์และตั้งค่าเทมเพลตให้ตรงกับแบรนด์ของคุณโดยอัตโนมัติ",
            upload_btn: "อัปโหลดไฟล์ตัวอย่าง",
            analyzing: "กำลังวิเคราะห์เอกสาร...",
            success: "อัปเดตเทมเพลตแล้ว!",
            template_content: "เนื้อหาเทมเพลต",
            contract: "สัญญา",
            header: "ข้อมูลส่วนหัว",
            terms: "เงื่อนไขและข้อกำหนด",
            footer: "ข้อความส่วนท้าย",
            appearance: "รูปลักษณ์",
            show_logo: "แสดงโลโก้",
            show_signature: "แสดงเส้นลายเซ็น",
            accent_color: "สีเน้น",
            font: "แบบอักษรเอกสาร",
            columns: "คอลัมน์ตารางรายการ",
            preview: "ตัวอย่าง"
        }
    },
    storage: {
        title: "คลังไฟล์",
        subtitle: "ไฟล์โครงการ",
        subtitle_root: "เลือกโครงการเพื่อดูไฟล์",
        upload: "อัปโหลด",
        empty_folder: "โฟลเดอร์ว่าง",
        empty_hint: "ไม่พบไฟล์ในตำแหน่งนี้",
        search_files: "ค้นหาไฟล์ในโครงการ...",
        search_projects: "ค้นหาโครงการ...",
        table: {
            type: "ประเภท",
            name: "ชื่อ",
            size: "ขนาด",
            date: "วันที่"
        }
    },
    team: {
        title: "ทีมงาน",
        subtitle: "จัดการทีมภายในและการเข้าถึงระบบ",
        add_member: "เพิ่มสมาชิก",
        create_team: "สร้างทีมใหม่",
        edit_team: "แก้ไขรายละเอียดทีม",
        search_placeholder: "ค้นหาชื่อ, ตำแหน่ง หรืออีเมล...",
        empty: "ไม่พบข้อมูลทีมงาน",
        user_detail: {
            edit_profile: "แก้ไขโปรไฟล์",
            no_phone: "ไม่มีเบอร์โทร",
            member_since: "สมาชิกตั้งแต่",
            rating: "คะแนน",
            stats: {
                completed_tasks: "งานที่เสร็จแล้ว",
                active_projects: "โครงการที่ดำเนินการ",
                expenses_claimed: "ค่าใช้จ่ายที่เบิก"
            },
            tabs: {
                overview: "ภาพรวม",
                activity: "ไทม์ไลน์กิจกรรม"
            },
            employment: {
                title: "ข้อมูลพนักงาน",
                joined_date: "วันที่เข้าร่วม",
                employee_id: "รหัสพนักงาน"
            },
            activity: {
                title: "ไทม์ไลน์กิจกรรม",
                export_csv: "ส่งออก CSV"
            }
        },
        onboarding: {
            welcome: "ยินดีต้อนรับสู่ HipslothProject",
            subtitle: "เพื่อเริ่มต้นใช้งาน กรุณาสร้างทีมหรือพื้นที่ทำงานแรกของคุณ",
            team_name: "ชื่อทีม",
            team_placeholder: "เช่น บริษัท ก่อสร้าง จำกัด",
            create_workspace: "สร้างพื้นที่ทำงาน",
            creating: "กำลังสร้าง...",
            main_workspace: "นี่จะเป็นพื้นที่ทำงานหลักของคุณ",
            hint: "คุณสามารถสร้างทีมเพิ่มทีหลังได้ เพื่อแยกส่วนงานหรือสาขา"
        },
        confirm_remove: {
            title: "ลบสมาชิก?",
            message: "คุณแน่ใจหรือไม่ที่จะลบ",
            warning: "บัญชีนี้จะไม่สามารถเข้าถึงระบบได้อีกต่อไป"
        }
    },
    dialogs: {
        add_user: {
            title_add: "เพิ่มสมาชิกใหม่",
            title_edit: "แก้ไขสมาชิก",
            full_name: "ชื่อ-นามสกุล",
            role: "ตำแหน่ง",
            status: "สถานะ",
            active: "ใช้งาน",
            inactive: "ระงับ",
            system_users_hint: "ผู้ใช้ระบบ: สามารถเข้าสู่ระบบแอปได้ สำหรับคนงานหน้างานหรือช่างภายนอก โปรดเมนู \"คู่ค้า/ช่าง\" แทน",
            cancel: "ยกเลิก",
            save: "บันทึกการแก้ไข",
            add: "เพิ่มสมาชิก"
        },
        add_partner: {
            title_add: "เพิ่มคู่ค้าใหม่",
            title_edit: "แก้ไขคู่ค้า",
            subtitle_add: "เพิ่มช่าง, ผู้รับเหมา หรือร้านค้าใหม่",
            subtitle_edit: "อัปเดตข้อมูลคู่ค้า",
            person: "บุคคล",
            business: "ธุรกิจ/ร้านค้า",
            name_person: "ชื่อ-นามสกุล",
            name_business: "ชื่อร้าน / บริษัท",
            role_skill: "ตำแหน่ง / ทักษะ",
            business_category: "ประเภทธุรกิจ",
            current_rating: "คะแนนปัจจุบัน",
            initial_rating: "คะแนนเริ่มต้น",
            save: "บันทึกคู่ค้า",
            update: "อัปเดตคู่ค้า"
        },
        invitations: {
            title: "เชิญทีมงาน",
            tabs: {
                link: "คัดลอกลิงก์",
                email: "ส่งอีเมล"
            },
            link_label: "ลิงก์คำเชิญ",
            copy: "คัดลอก",
            copied: "คัดลอกแล้ว",
            or_share_code: "หรือแชร์รหัส",
            org_id_label: "รหัสองค์กร (ID)",
            email_label: "ที่อยู่อีเมล",
            email_placeholder: "colleague@example.com",
            send_invite: "ส่งคำเชิญ",
            sent_via_mail: "ส่งผ่านแอปเมลแล้ว",
            email_hint: "ระบบจะเปิดแอปอีเมลพื้นฐานของคุณพร้อมข้อความคำเชิญที่จัดเตรียมไว้ให้",
            success_placeholder: "สร้างรายการชั่วคราวสำหรับ {email} แล้ว",
        },
        join_org: {
            title: "เข้าร่วมองค์กร",
            subtitle: "ระบุรหัสคำเชิญที่คุณได้รับจากผู้ดูแลระบบ",
            invite_code: "รหัสคำเชิญ",
            placeholder: "วางรหัสคำเชิญที่นี่",
            join_btn: "เข้าร่วมองค์กร",
            joining: "กำลังเข้าร่วม...",
            back_to_create: "กลับไปหน้าสร้างทีม",
            success_title: "เข้าร่วมสำเร็จ!",
            success_msg: "ยินดีต้อนรับสู่ทีม เรากำลังพาท่านไปที่หน้าแผงควบคุม...",
            preview_title: "คุณได้รับเชิญให้เข้าร่วม",
            members_count: "สมาชิก {count} คน",
            sign_in_required: "กรุณาเข้าสู่ระบบเพื่อเข้าร่วมองค์กรนี้",
        },
        add_project: {
            title: "เพิ่มโครงการด่วน",
            subtitle: "สร้างโครงการใหม่อย่างรวดเร็ว",
            name: "ชื่อโครงการ",
            customer: "ชื่อลูกค้า",
            location: "สถานที่",
            budget: "งบประมาณ",
            start_date: "วันเริ่ม",
            end_date: "วันสิ้นสุด",
            save: "บันทึกโครงการ",
            placeholders: {
                name: "เช่น รีโนเวทบ้านใหม่",
                customer: "เช่น คุณสมชาย",
                location: "เช่น สุขุมวิท 101",
                budget: "เช่น 1000000"
            }
        }
    },
    contracts: {
        title: "สัญญาจ้าง",
        title_with_workers: "สัญญา / คนงาน",
        subtitle: "จัดการสัญญาจ้างและการแบ่งจ่ายงวดงาน",
        new_contract: "สร้างสัญญา",
        total_value: "มูลค่าสัญญา",
        print_preview: "พิมพ์ / ตัวอย่าง",
        scope: "ขอบเขตงาน",
        installments: "งวดการจ่ายเงิน",
        due: "กำหนดชำระ",
        note: "หมายเหตุ",
        pay_now: "ชำระเงิน",
        confirm_payment: "ยืนยันการชำระเงินจำนวน",
        confirm_hint: "ระบบจะสร้างรายการค่าใช้จ่ายให้อัตโนมัติ",
        empty: "ยังไม่มีสัญญา",
        empty_hint: "เริ่มสร้างสัญญาเพื่อติดตามการจ่ายเงินคนงาน",
        dialog: {
            title: "สร้างสัญญาใหม่",
            subtitle: "กรอกรายละเอียดสัญญาจ้าง",
            edit_title: "แก้ไขสัญญา",
            edit_subtitle: "แก้ไขรายละเอียดสัญญา",
            create_title: "สร้างสัญญาจ้างงาน",
            worker: "คนงาน / ผู้รับเหมา",
            project: "โครงการ",
            title_field: "ชื่อสัญญา",
            title_placeholder: "เช่น งานติดตั้งระบบไฟฟ้า ระยะที่ 1",
            scope: "ขอบเขตงาน",
            scope_mode_items: "เลือกเป็นข้อ",
            scope_mode_freeform: "พิมพ์เอง",
            scope_placeholder_item: "รายละเอียดงาน...",
            scope_placeholder_freeform: "พิมพ์รายละเอียดขอบเขตงานทั้งหมด...",
            add_item: "เพิ่มรายการ",
            total_amount: "มูลค่ารวม",
            start_date: "วันเริ่มสัญญา",
            end_date: "วันสิ้นสุด",
            installments: "งวดการจ่ายเงิน",
            add_installment: "เพิ่มงวด",
            installment_desc: "รายละเอียดงวด",
            installment_amount: "จำนวนเงิน",
            payment_details: "รายละเอียดการจ่าย (เช่น โอนเงิน, เงินสด, เช็ค...)",
            notes: "หมายเหตุ",
            notes_placeholder: "เงื่อนไขเพิ่มเติม, ข้อตกลงพิเศษ, หรือหมายเหตุอื่นๆ...",
            save: "บันทึกการแก้ไข",
            create: "สร้างสัญญา",
            cancel: "ยกเลิก"
        },
        document: {
            title: "สัญญาจ้างงาน",
            parties_title: "คู่สัญญา",
            employer: "ผู้ว่าจ้าง:",
            worker: "ผู้รับจ้าง / คนงาน:",
            project: "โครงการ:",
            duration: "ระยะเวลา:",
            to: "ถึง",
            tbd: "ยังไม่กำหนด",
            scope_title: "ขอบเขตงาน",
            schedule_title: "งวดการจ่ายเงิน",
            desc: "รายละเอียด",
            due_date: "กำหนดจ่าย",
            amount: "จำนวนเงิน",
            total_value: "มูลค่าสัญญารวม:",
            notes_title: "หมายเหตุ / เงื่อนไข:",
            sign_employer: "ผู้ว่าจ้าง",
            sign_worker: "ผู้รับจ้าง"
        }
    },
    customers: {
        title: "รายชื่อลูกค้า",
        subtitle: "จัดการข้อมูลผู้ว่าจ้าง",
        add_customer: "เพิ่มลูกค้า",
        search_placeholder: "ค้นหาด้วยเบอร์โทร...",
        active: "โครงการ",
        empty: "ไม่พบรายชื่อลูกค้า",
        dialog: {
            title: "เพิ่มลูกค้าใหม่",
            subtitle: "กรอกข้อมูลลูกค้าด้านล่าง",
            name: "ชื่อลูกค้า",
            type: "ประเภท",
            types: {
                individual: "บุคคลธรรมดา",
                company: "นิติบุคคล"
            },
            phone: "เบอร์โทรศัพท์",
            line_id: "Line ID",
            address: "ที่อยู่",
            tax_id: "เลขผู้เสียภาษี",
            save: "บันทึกข้อมูล"
        }
    },
    login: {
        title: "ยินดีต้อนรับกลับ",
        subtitle: "เข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ด HipslothProject",
        email: "อีเมล",
        password: "รหัสผ่าน",
        forgot_password: "ลืมรหัสผ่าน?",
        sign_in: "เข้าสู่ระบบ",
        or_continue: "หรือเข้าสู่ระบบด้วย",
        sign_in_google: "เข้าสู่ระบบด้วย Google",
        secured_by: "ปลอดภัยโดย HipslothProject",
        privacy_policy: "นโยบายความเป็นส่วนตัว",
        no_account: "ยังไม่มีบัญชี?",
        sign_up: "สมัครสมาชิก",
        error_login_failed: "เข้าสู่ระบบไม่สำเร็จ",
        error_invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    },
    register: {
        back_to_login: "กลับไปหน้าเข้าสู่ระบบ",
        title: "สร้างบัญชี",
        subtitle: "เข้าร่วม HipslothProject และจัดการโครงการอย่างมีประสิทธิภาพ",
        full_name: "ชื่อ-นามสกุล",
        email: "อีเมล",
        password: "รหัสผ่าน",
        confirm_password: "ยืนยันรหัสผ่าน",
        create_account: "สร้างบัญชี",
        or_continue: "หรือลงทะเบียนด้วย",
        sign_up_google: "ลงทะเบียนด้วย Google",
        already_have: "มีบัญชีอยู่แล้ว?",
        sign_in: "เข้าสู่ระบบ",
        error_mismatch: "รหัสผ่านไม่ตรงกัน",
        error_length: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        error_email_in_use: "อีเมลนี้ถูกใช้งานแล้ว",
        error_failed: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    },
    forgot_password: {
        back_to_login: "กลับไปหน้าเข้าสู่ระบบ",
        title: "ลืมรหัสผ่าน?",
        subtitle: "ไม่ต้องกังวล เราจะส่งคำแนะนำการรีเซ็ตให้คุณ",
        email: "อีเมล",
        placeholder: "กรอกอีเมลของคุณ",
        reset: "รีเซ็ตรหัสผ่าน",
        sending: "กำลังส่ง...",
        check_email: "ตรวจสอบอีเมลของคุณ",
        sent_to: "เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่",
        return_to_login: "กลับไปหน้าเข้าสู่ระบบ",
        didnt_receive: "ไม่ได้รับอีเมล?",
        resend: "คลิกเพื่อส่งอีกครั้ง"
    },
    welcome_back: {
        greeting: "ยินดีต้อนรับกลับ,",
        fallback_name: "เพื่อน",
        loading: "เรากำลังเตรียมทุกอย่างให้คุณ..."
    },
    onboarding: {
        loading: "กำลังโหลด...",
        welcome: "ยินดีต้อนรับ,",
        get_started: "มาเริ่มกันเลย คุณต้องการดำเนินการอย่างไร?",
        continue_to: "ไปยัง",
        enter_workspace: "เข้าสู่พื้นที่ทำงานของคุณ",
        create_team: "สร้างทีมใหม่",
        create_desc: "ตั้งค่าพื้นที่ทำงานใหม่ตั้งแต่ต้น",
        join_team: "เข้าร่วมทีมที่มีอยู่",
        join_desc: "กรอกรหัสเชิญหรือลิงก์",
        back: "กลับ",
        name_team: "ตั้งชื่อทีมของคุณ",
        company_question: "ชื่อบริษัทหรือองค์กรของคุณคืออะไร?",
        team_name: "ชื่อทีม",
        placeholder: "บริษัท ก่อสร้างตัวอย่าง จำกัด",
        creating: "กำลังสร้าง...",
        create_workspace: "สร้างพื้นที่ทำงาน",
        join_title: "เข้าร่วมทีม",
        ask_admin: "ขอลิงก์เชิญหรือรหัสจากผู้ดูแลทีมของคุณ",
        have_link: "มีลิงก์เชิญหรือไม่?",
        link_hint: "การคลิกลิงก์จะเพิ่มคุณเข้าทีมโดยอัตโนมัติ",
        enter_code: "หรือกรอกรหัสด้วยตนเอง",
        enter_invite: "กรอกรหัสเชิญ",
        join: "เข้าร่วมทีม"
    },
    invite: {
        login_required: "กรุณาเข้าสู่ระบบเพื่อเข้าร่วมทีมนี้",
        go_to_login: "ไปหน้าเข้าสู่ระบบ",
        verifying: "กำลังตรวจสอบการเชิญ...",
        invalid: "ลิงก์ไม่ถูกต้อง",
        invalid_desc: "ลิงก์เชิญนี้ไม่ถูกต้องหรือหมดอายุแล้ว",
        back_home: "กลับหน้าหลัก",
        invited_to: "คุณได้รับเชิญให้เข้าร่วม",
        join_workspace: "เข้าร่วมพื้นที่ทำงาน",
        cancel: "ยกเลิก"
    },
    privacy: {
        back_to_login: "กลับไปหน้าเข้าสู่ระบบ",
        title: "นโยบายความเป็นส่วนตัว",
        last_updated: "อัปเดตล่าสุด"
    },

    bored: {
        subtitle: "สะสมสมาชิกในทีมเพื่อให้ตัวคุณยาวขึ้น!",
        best: "ดีที่สุด: {score}",
        score: "คะแนน: {score}",
        leaderboard: "ตารางคะแนน",
        no_scores: "ยังไม่มีคะแนน มาร่วมสนุกเป็นคนแรกสิ!",
        instructions_title: "วิธีเล่น",
        instructions_desc: "ใช้ปุ่มลูกศรเพื่อนำทาง สะสมสมาชิกในทีมเพื่อต่อตัวให้ยาวขึ้น อย่าชนกำแพงหรือชนตัวเอง!",
        staff_power_title: "พลังของพนักงาน",
        staff_power_desc: "สมาชิกในทีมแต่ละคนที่คุณสะสมจะเพิ่มคะแนนประสิทธิภาพให้กับทีม +10 คะแนน คุณจะสามารถติดอันดับสูงสุดได้หรือไม่?",
        game_over: "จบเกม",
        final_score: "คะแนนรวม",
        try_again: "ลองอีกครั้ง",
        start_game: "เริ่มเกม",
        move_instruction: "ใช้ปุ่มลูกศรเพื่อเคลื่อนที่",
    },

    policy: {
        last_updated: "อัปเดตล่าสุด: 20 มกราคม 2569",
        data_privacy: {
            title: "ความเป็นส่วนตัวของข้อมูล",
            content: "ที่ HipslothProject เราให้ความสำคัญกับความเป็นส่วนตัวของข้อมูลคุณ เนื่องจากแอปพลิเคชันทำงานเป็น Progressive Web App (PWA) ที่มีความสามารถในการทำงานแบบ Local-first ข้อมูลการดำเนินงานของคุณ (ค่าใช้จ่าย, งาน, เอกสาร) จึงถูกจัดเก็บอย่างปลอดภัยบนอุปกรณ์ของคุณและผ่านการซิงโครไนซ์บนคลาวด์ที่เข้ารหัส"
        },
        usage_policy: {
            title: "นโยบายการใช้งาน",
            content: "ผู้ใช้มีหน้าที่รับผิดชอบต่อความถูกต้องของข้อมูลทางการเงินและเอกสารที่สร้างขึ้นภายในแอป HipslothProject เป็นเครื่องมือสำหรับการจัดการและไม่ได้ถือเป็นการให้คำปรึกษาด้านการบัญชีหรือกฎหมายอย่างเป็นทางการ"
        },
        security: {
            title: "ความมุ่งมั่นด้านความปลอดภัย",
            points: [
                "การรับส่งข้อมูลที่มีการเข้ารหัสระหว่างไคลเอนต์และเซิร์ฟเวอร์",
                "การสำรองข้อมูลอัตโนมัติเป็นประจำสำหรับข้อมูลองค์กรทั้งหมด",
                "การควบคุมการเข้าถึงตามบทบาท (RBAC) ที่เข้มงวดเพื่อจำกัดข้อมูลที่ละเอียดอ่อน",
                "การป้องกันด้วยรหัส PIN สำหรับอุปกรณ์พกพา"
            ]
        },
        footer: "สำหรับข้อกำหนดการให้บริการฉบับสมบูรณ์หรือการสอบถามทางกฎหมายที่เฉพาะเจาะจง โปรดติดต่อทีมกฎหมายของเราที่ legal@hipslothproject.app"
    },

    about: {
        tagline: "HipslothProject - เพื่อนคู่ใจสำหรับทีมก่อสร้างยุคใหม่",
        version: "เวอร์ชัน",
        mission_title: "ภารกิจของเรา",
        mission_desc: "เพื่อให้การจัดการโครงการสำหรับทีมก่อสร้างและรีโนเวทเป็นเรื่องง่าย โดยการจัดหาเครื่องมือที่มีประสิทธิภาพสำหรับการติดตามการเงิน การจัดการงาน และการทำงานร่วมกับลูกค้า ทั้งหมดนี้รวมอยู่ในอินเทอร์เฟซที่ใช้งานง่ายเพียงหนึ่งเดียว",
        support_title: "ความช่วยเหลือและช่องทางติดต่อ",
        email_support: "ความช่วยเหลือผ่านอีเมล",
        official_website: "เว็บไซต์อย่างเป็นทางการ",
        rights_reserved: "© 2569 HipslothProject. สงวนลิขสิทธิ์"
    }
}
