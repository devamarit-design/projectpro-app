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
    navbar: {
        home: "หน้าแรก",
        finance: "การเงิน",
        more: "อื่นๆ",
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
                files: "ไฟล์"
            },
            overview: {
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
        unpaid: "ยังไม่จ่าย",
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
            task: "งานย่อย / ส่วนของงาน",
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
            theme: "ธีมแอปพลิเคชัน"
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
            warning_days: "แจ้งเตือนล่วงหน้า (วัน)",
            warning_desc: "ต้องการให้แจ้งเตือนล่วงหน้ากี่วันก่อนถึงกำหนด?",
            overdue: "แจ้งเตือนเกินกำหนด",
            overdue_desc: "รับการแจ้งเตือนทันทีเมื่อรายการเกินกำหนด",
            assignments: "การมอบหมายงาน",
            assignments_desc: "รับการแจ้งเตือนเมื่อคุณได้รับมอบหมายงานใหม่"
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
        onboarding: {
            welcome: "ยินดีต้อนรับสู่ ProjectPro",
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
    }
}
