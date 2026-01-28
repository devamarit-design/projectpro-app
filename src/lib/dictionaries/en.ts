export const en = {
    common: {
        dashboard: "Dashboard",
        projects: "Projects",
        income: "Income & Docs",
        expenses: "Expenses",
        tasks: "Tasks",
        storage: "Storage",
        contracts: "Contracts",
        settings: "Settings",
        team: "Team",

        search: "Search...",
        edit: "Edit",
        delete: "Delete",
        add_new: "Add New",
        remove: "Remove",
        save: "Save",
        cancel: "Cancel",
        status: "Status",
        view: "View",
        customers: "Customers",
        profile: "Profile",
        edit_profile: "Edit Profile",
        personal_info: "Personal Information",
        account_settings: "Account Settings",

        partners: "Partners",
        log_out: "Log Out",
        confirm_logout: "Are you sure you want to log out?",
        loading: "Loading...",
    },

    calendar: {
        title: "Organization Calendar",
        subtitle: "View tasks and payment schedules in one place",
        all_events: "All Events",
        payments: "Payments",
        payment: "Payment",
        due_date: "Due Date",
        amount: "Amount",
        month: "Month",
        week: "Week",
        today: "Today",
    },

    schedule: {
        title: "Global Schedule",
        subtitle: "View all organizational tasks in a unified timeline",
    },

    partners: {
        title: "Partners",
        subtitle: "Manage technicians, contractors, and material stores.",
        add_partner: "Add Partner",
        search_placeholder: "Search partners...",
        tabs: {
            all: "All",
            technician: "Technician",
            store: "Store",
            contractor: "Contractor"
        },
        view_details: "View Details",
        no_phone: "No phone",
        no_location: "No location",
        empty: "No partners found"
    },

    notifications: {
        title: "Notifications",
        stay_updated: "Stay updated with latest activities",
        mark_all_read: "Mark all as read",
        alerts: {
            task_overdue: "Task Overdue",
            task_due_soon: "Task Due Soon",
            task_overdue_msg: "Task in {project} is overdue by {days} days.",
            task_due_today_msg: "Task in {project} is due today.",
            task_due_days_msg: "Task in {project} is due in {days} days.",

            payment_overdue: "Payment Overdue",
            unpaid_expense: "Unpaid Expense",
            expense_overdue_msg: "Expense is unpaid for {days} days.",
            expense_pending_msg: "Expense is pending payment for {days} days.",

            installment_overdue: "Installment Overdue",
            installment_due_soon: "Installment Due Soon",
            installment_overdue_msg: "Payment '{description}' for {contract} is overdue by {days} days.",
            installment_due_today_msg: "Payment '{description}' for {contract} is due today.",
            installment_due_days_msg: "Payment '{description}' for {contract} is due in {days} days."
        },
        clear: "Clear",
        no_notifications: "No notifications",
        caught_up: "You're all caught up!",
        view_details: "View details",
        today: "Today",
        yesterday: "Yesterday",
        earlier: "Earlier",
        material_delivery: "Material Delivery Arrived",
        payment_overdue: "Payment Overdue",
        new_task: "New Task Assigned",
        budget_warning: "Budget Warning",
        system_update: "System Update",
        tabs: {
            today: "Today",
            yesterday: "Yesterday",
            earlier: "Earlier"
        }
    },
    team_settings: {
        invitation_link: "Invitation Link",
        invitation_desc: "Send this link to your team members to let them join your organization automatically.",
        copy: "Copy",
        enable_link: "Enable Link",
        enable_link_desc: "Allow new members to join via link.",
        default_permissions: "Default Permissions",
        default_role_desc: "Choose the default role for new members joining via the link.",
        default_role: "Default Role",
        roles: {
            member: "Member (View & Comment)",
            editor: "Editor (Edit Projects)",
            admin: "Admin (Full Access)"
        },
        team_members: "Team Members",
        manage_members: "Manage existing team members and their roles.",
        active_members: "You have {{count}} active members in your team.",
        manage_team: "Manage Team",
        enter_team_name: "Enter new team name:"
    },
    search: {
        title: "Search Results",
        found_results: "Found {{count}} results for \"{{query}}\"",
        enter_term: "Enter a search term",
        search_hint: "Search for projects, tasks, or contracts.",
        sections: {
            projects: "Projects",
            tasks: "Tasks"
        },
        in_project: "in",
        no_results: "No results found.",
        adjust_terms: "Try adjusting your search terms."
    },
    profile: {
        fields: {
            name: "Full Name",
            email: "Email Address",
            phone: "Phone Number",
            role: "Role"
        }
    },
    auth: {
        new_password: "New Password",
        confirm_password: "Confirm New Password",
        password_mismatch: "Passwords do not match",
        password_length: "Password must be at least 6 characters"
    },
    navbar: {
        home: "Home",
        finance: "Finance",
        more: "More",
        about: "About App",
        policy: "Policy",
        bored: "Bored?",
        quick_add: "Quick Add",
        more_utils: "More Utils",
        project: "Project",
    },
    finance: {
        income: "Income",
        expense: "Expense",
        quotation: "Quotation",
        invoice: "Invoice",
        receipt: "Receipt",
        all_items: "All Items",
        manage_docs: "Manage quotations, invoices, and receipts.",
    },
    projects: {
        my_projects: "My Projects",
        new_project: "Create New Project",
        create_project: "New Project",
        manage_projects: "Manage your construction projects",
        search_placeholder: "Search projects...",
        filter: "Filter",
        customer: "Customer",
        budget: "Budget",
        cost_value: "Cost Paid / Value",
        due: "Due",
        status: {
            all: "All",
            in_progress: "In Progress",
            completed: "Completed",
            on_hold: "On Hold",
        },
        empty: "No projects found matching your criteria",
        edit: {
            title: "Edit Project",
            subtitle: "Update project details",
            fields: {
                name: "Project Name",
                customer: "Customer",
                location: "Location",
                status: "Status",
                desc: "Description",
                start_date: "Start Date",
                end_date: "End Date",
                budget: "Estimated Budget",
                income: "Income / Received",
                expenses: "Expenses / Costs",
                image: "Cover Image"
            },
            placeholders: {
                name: "e.g. Modern Office Complex",
                location: "Project site address",
                desc: "Brief description of the project scope...",
                select_customer: "Select Customer"
            },
            sections: {
                details: "Project Details",
                timeline: "Timeline & Budget",
                image: "Cover Image"
            },
            upload_area: {
                title: "Click to upload or drag and drop",
                subtitle: "SVG, PNG, JPG or GIF (max. 3MB)"
            }
        },
        detail: {
            tabs: {
                overview: "Overview",
                financials: "Financials",
                tasks: "Tasks",
                files: "Files",
                sub_projects: "Sub-projects"
            },
            overview: {
                details: "Project Details",
                description: "Project Description",
                no_desc: "No description provided for this project.",
                timeline: "Timeline Details",
                start_date: "Start Date",
                end_date: "Estimated End",
                current_status: "Current Status"
            },
            financials: {
                contract_value: "Contract Value",
                received: "Received",
                total_expenses: "Total Expenses",
                profit_est: "Profit (Est.)",
                material: "Material",
                labor: "Labor",
                subcontract: "Sub-contract",
                history: "Financial History",
                add_expense: "Add Expense",
                no_expenses: "No expenses recorded for this project yet.",
                transactions: "transaction(s)",
                transactions_count: "transaction(s)",
                no_payee: "No Payee",
                empty_expenses: "No expenses recorded for this project yet.",
                month_filter: "All Months"
            },
            tasks: {
                add_task: "Add Task",
                all_users: "All Users",
                empty: "Empty",
                quick_add: "Add Task",
                unassigned: "Unassigned",
                status: {
                    todo: "To Do",
                    in_progress: "In Progress",
                    done: "Done"
                },
                priority: {
                    low: "Low",
                    medium: "Medium",
                    high: "High"
                }
            },
            files: {
                title: "Project Files",
                upload: "Upload File",
                no_files: "No files here",
                no_files_sub: "Upload plans, contracts, or photos for this project.",
                enter_name: "Enter file name:",
                enter_file_name: "Enter file name:"
            },
            header: {
                client: "Client",
                cost_paid: "Cost Paid / Work Value",
                edit_project: "Edit Project",
                delete_project: "Delete Project",
                confirm_delete: "Are you sure you want to delete this project?"
            }
        }
    },
    dashboard: {
        total_revenue: "Total Revenue",
        total_expenses: "Total Expenses",
        net_profit: "Net Profit",
        active_projects: "Active Projects",
        download_report: "Download Report",
        cash_flow: "Cash Flow",
        my_work: "My Work",
        personal: "Personal",
        greeting_morning: "Good Morning",
        greeting_afternoon: "Good Afternoon",
        greeting_evening: "Good Evening",
        personal_overview: "Here's your personal overview for today.",
        quick_stats: "Quick Stats",
        pending_tasks: "Pending Tasks",
        this_week: "This Week",
        my_tasks: "My Tasks",
        pending_tasks_count: "You have {{count}} pending tasks",
        view_all: "View All",
        no_active_tasks: "No active tasks assigned to you.",
        activity_feed: "Activity Feed",
        filters: {
            all_projects: "All Projects",
            all_users: "All Users"
        },
        no_activity: "No activity found for these filters."
    },
    expenses: {
        title: "Expenses",
        subtitle: "Track and manage project costs.",
        create_contract: "Create Contract",
        add_expense: "Add Expense",
        manual_entry: "Manual Entry",
        smart_scan: "Smart Scan AI",
        unpaid: "Cancel",
        advanced: "Advanced",
        credit: "Credit",
        categories: {
            all: "All",
            material: "Material",
            labor: "Labor",
            subcontract: "Contract",
            other: "Other"
        },
        filters: {
            all_months: "All Months",
            all_status: "All Status",
            all_projects: "All Projects",
            all_users: "All Users",
            search_placeholder: "Search expenses..."
        },
        sort: {
            label: "Sort by",
            created: "Created Date",
            date: "Bill Date",
            alphabetical: "Alphabetical (A-Z)"
        },
        empty: "No expenses found",
        empty_hint: "Try adjusting your filters or add a new expense.",
        dialog: {
            title: "Add Expense",
            subtitle: "Record payments, bills, or invoices.",
            bill_title: "Bill Title",
            bill_placeholder: "e.g. Purchase Materials",
            date: "Date",
            category: "Category",
            payee: "Store / Payee",
            payee_labor: "Worker / Technician",
            select_vendor: "Select Vendor...",
            select_person: "Select Person...",
            add_new_person: "+ Add New Person...",
            add_new_vendor: "+ Add New Vendor...",
            bill_assignment: "Bill Assignment",
            combine_bill: "Combine Bill (Single Project)",
            split_bill: "Split Bill (Multi-Project)",
            project: "Project",
            task: "Sub-project",
            add_new_sub_project: "+ Add New Sub-project...",
            item_breakdown: "Item Breakdown",
            vat_included: "VAT Included (7%)",
            add_line_item: "Add Line Item",
            subtotal: "Subtotal",
            vat: "VAT",
            grand_total: "GRAND TOTAL",
            payment_status: "Payment Status",
            paid_by: "Paid By",
            vendor: "Vendor",
            receipt_image: "Receipt / Image",
            upload_hint: "Click to upload receipt",
            save: "Save Expense",
            cancel: "Cancel",
            item_desc: "Item description",
            quantity: "Qty",
            unit_price: "Unit Price",
            quick_add: "Add New"
        }
    },
    tasks: {
        title: "Tasks",
        subtitle: "Manage project tasks and assignments across all projects.",
        new_task: "New Task",
        add_task: "Add Task",
        search_placeholder: "Search tasks or projects...",
        filters: {
            all_projects: "All Projects",
            all_users: "All Users"
        },
        status: {
            todo: "Todo",
            in_progress: "In Progress",
            done: "Done"
        },

        empty: "Empty",
        priority: {
            high: "High",
            medium: "Medium",
            low: "Low"
        },
        dialog: {
            title: "New Task",
            subtitle: "Create a new assignment",
            task_title: "Task Title",
            title_placeholder: "What needs to be done?",
            assign_project: "Assign to Project",
            select_project: "Select Project",
            priority: "Priority",
            due_date: "Due Date",
            assignee: "Assignee",
            unassigned: "Unassigned",
            create: "Create Task"
        },
        no_date: "No date",
        unassigned: "Unassigned"
    },
    income: {
        title: "Income",
        subtitle: "Manage quotations, billing notes, and receipts.",
        add_new: "Add New",
        tabs: {
            all: "All Items",
            quotation: "Quotation",
            invoice: "Invoice",
            receipt: "Receipt"
        },
        filters: {
            all_projects: "All Projects",
            all_months: "All Months",
            all_customers: "All Customers",
            all_techs: "All Techs",
            search_placeholder: "Search by No. or Customer..."
        },
        sort: {
            label: "Sort by",
            created: "Created Date",
            date: "Document Date",
            alphabetical: "Alphabetical (A-Z)"
        },
        table: {
            no: "No.",
            type: "Type",
            customer_project: "Customer / Project",
            date: "Date",
            total: "Total",
            status: "Status"
        },
        empty: "No documents found matching criteria.",
        dialog: {
            title: "Create New Income",
            subtitle: "Create a new income record",
            edit: "Edit",
            new: "New",
            save: "Save",
            select_customer: "Select Customer",
            create_customer: "+ Create New Customer",
            select_project: "Select Project",
            create_project: "+ Create New Project",
            mode_simple_desc: "Simple (Combine)",
            mode_zone_desc: "Zone (Split)",
            zone_name_placeholder: "Zone Name (e.g. Living Room)",
            add_zone: "Add New Zone",
            tabs: {
                simple: "Simple",
                zone: "Zone"
            },
            sections: {
                document_details: "Document Details",
                tax_settings: "Tax Settings",
                items: "Items",
                summary: "Summary",
                additional_info: "Additional Information"
            },
            fields: {
                doc_type: "Document Type",
                doc_no: "Document No",
                ref_no: "Reference No",
                date: "Date",
                project: "Project",
                customer: "Client / Customer",
                tax_type: "Tax Type",
                tax_rate: "Tax Rate",
                wht: "Withholding Tax"
            },
            items: {
                add: "Add Item",
                name: "Item Name",
                desc: "Description",
                qty: "Qty",
                price: "Price",
                unit: "Unit",
                total: "Total",
                zone: "Zone",
                section: "Section",
                block: "Block",
                unit_info: "Unit Info"
            },
            summary: {
                subtotal: "Subtotal",
                discount: "Discount",
                tax: "Tax",
                grand_total: "Grand Total",
                wht: "Withholding Tax",
                net_total: "Net Total"
            },
            notes: {
                label: "Notes",
                placeholder: "Additional notes..."
            },
            payment_terms: {
                label: "Payment Terms",
                placeholder: "e.g., Net 30"
            },
            footer: {
                cancel: "Cancel",
                create: "Create"
            },
            doc_types: {
                quotation: "Quotation",
                invoice: "Invoice",
                receipt: "Receipt"
            }
        }
    },
    settings: {
        title: "Settings",
        subtitle: "Manage your organization preferences and document templates.",
        menu: {
            company: "Company Profile",
            documents: "Documents",
            notifications: "Notifications",
            team: "Team & Roles",
            security: "Security & Lock",
            data: "Data Management",
            theme: "App Theme",
            telegram: "Telegram"
        },
        telegram: {
            title: "Telegram Notifications",
            subtitle: "Connect Telegram Bot for chat notifications",
            setup_guide: "How to create Telegram Bot",
            setup_step1: "Open Telegram and search for @BotFather",
            setup_step2: "Type /newbot and follow instructions",
            setup_step3: "Copy the received Bot Token",
            setup_step4: "Add Bot to the group you want notifications",
            setup_step5: "Find Chat ID using @RawDataBot",
            open_botfather: "Open BotFather",
            find_chatid: "Find Chat ID",
            config_title: "Bot Configuration",
            config_desc: "Enter your Bot Token and Chat ID",
            bot_token: "Bot Token",
            chat_id: "Chat ID",
            chat_id_hint: "Group Chat ID (starts with -100 for supergroups)",
            test_conn: "Test Connection",
            types_title: "Notification Types",
            types_desc: "Select which notifications you want to receive",
            notify_expense: "Notify on Expense Creation",
            notify_expense_desc: "Get notified immediately when a new expense is created",
            notify_quotation: "Notify on Quotation",
            notify_quotation_desc: "Get notified when a new quotation is created",
            notify_payment: "Notify on Payment Due",
            notify_payment_desc: "Get notified when payment is due soon",
            notify_daily_tasks: "Daily Task Summary",
            notify_daily_tasks_desc: "Receive a summary of tasks due today at 8:00 AM",
            days_advance: "Advance Notice (Days)",
            save_btn: "Save Settings",
            save_success: "Settings saved successfully",
            test_success: "Test message sent successfully!"
        },
        company: {
            title: "Your Company",
            subtitle: "This information will appear on your documents.",
            change_logo: "Change Logo",
            fields: {
                name: "Company Name",
                tax_id: "Tax ID / Registration No.",
                address: "Address",
                phone: "Phone",
                email: "Email",
                website: "Website"
            },
            placeholders: {
                name: "Company Co., Ltd.",
                tax_id: "0000000000000",
                address: "123 Street...",
                phone: "02-xxx-xxxx",
                email: "contact@company.com",
                website: "https://..."
            }
        },
        theme: {
            title: "Appearance",
            color: "Theme Color",
            font: "App Font",
            mode: "Interface Mode",
            mode_light: "Light",
            mode_dark: "Dark",
            mode_system: "System",
            roundness: "Interface Roundness",
            roundness_desc: "Adjust how round buttons and cards look.",
            roundness_sharp: "Sharp",
            roundness_round: "Round",
            roundness_standard: "Standard",
            reset: "Reset",
            save: "Save Changes",
            saved: "Saved!",
            global_hint: "Changes are applied globally to the app."
        },
        data: {
            title: "Data Management",
            subtitle: "Backup your data or restore from a previous backup file.",
            backup: {
                title: "Backup Data",
                desc: "Download a copy of all projects, expenses, and settings to your computer.",
                button: "Export JSON",
                last_backup: "Last backup: never"
            },
            restore: {
                title: "Restore Data",
                desc: "Restore your data from a JSON backup file.",
                warning: "Warning: This will replace current data.",
                button: "Restore from Backup",
                button_restoring: "Restoring...",
                supported: "Supported format: .json"
            },
            important: {
                title: "Important Note",
                desc: "Since this app works offline, your data is stored in this browser. Clearing your browser's Site Data or Cache will remove your data. Please backup regularly."
            },
            messages: {
                success_backup: "Backup file downloaded successfully.",
                error_backup: "Failed to generate backup file.",
                invalid_type: "Invalid file type. Please upload a JSON backup file.",
                confirm_restore: "WARNING: This will REPLACE all current data with the backup data. This action cannot be undone. Are you sure?",
                success_restore: "Data restored successfully! The app will reload locally.",
                error_restore: "Failed to restore data. See console for details.",
                error_parse: "Failed to parse backup file. Is it a valid JSON?"
            }
        },
        security: {
            title: "App Security",
            subtitle: "Protect your data with a PIN code lock.",
            lock: {
                title: "App Lock",
                enabled: "Enabled (PIN Set)",
                disabled: "Disabled (No PIN)",
                enable_btn: "Enable Lock",
                change_btn: "Change PIN"
            },
            form: {
                current_pin: "Current PIN",
                new_pin: "New PIN",
                confirm_pin: "Confirm PIN",
                save: "Save PIN",
                update: "Update PIN",
                cancel: "Cancel",
                placeholder: "Enter 4-6 digits"
            },
            disable: {
                btn: "Disable App Lock",
                title: "Disable Security?",
                desc: "Anyone with access to this device will be able to view your data.",
                confirm_btn: "Disable Lock"
            },
            messages: {
                length_error: "PIN must be at least 4 digits",
                match_error: "PINs do not match",
                success_set: "PIN Code set successfully",
                verify_error: "Current PIN is incorrect",
                success_update: "PIN Code updated successfully",
                success_disable: "App Lock disabled"
            }
        },
        notifications: {
            title: "Alert Preferences",
            warning_days_task: "Task Advance Warning (Days)",
            warning_days_expense: "Expense Advance Warning (Days)",
            warning_desc: "How many days in advance should we alert you about due dates?",
            overdue: "Overdue Alerts",
            overdue_desc: "Get notified immediately when items are overdue.",
            assignments: "Task Assignments",
            assignments_desc: "Get notified when you are assigned to a new task.",
            push_title: "Push Notifications",
            push_desc: "Receive notifications on this device",
            enable_push: "Enable Push"
        },
        documents: {
            setup_title: "AI Template Setup",
            setup_desc: "Upload an example of your existing document (PDF/Image). Our AI will analyze it and automatically set up your template settings to match your brand.",
            upload_btn: "Upload Example File",
            analyzing: "Analyzing Document...",
            success: "Template Updated!",
            template_content: "Template Content",
            contract: "Contract",
            header: "Header Information",
            terms: "Terms & Conditions",
            footer: "Footer Text",
            appearance: "Appearance",
            show_logo: "Show Logo",
            show_signature: "Show Signature Line",
            accent_color: "Accent Color",
            font: "Document Font",
            columns: "Item Table Columns",
            preview: "Preview"
        }
    },
    storage: {
        title: "Storage",
        subtitle: "Project Files",
        subtitle_root: "Select a project to view files",
        upload: "Upload",
        empty_folder: "Empty Folder",
        empty_hint: "No items found in this location.",
        search_files: "Search files in project...",
        search_projects: "Search projects...",
        table: {
            type: "Type",
            name: "Name",
            size: "Size",
            date: "Date"
        }
    },
    team: {
        title: "Team Members",
        subtitle: "Manage internal team and access permissions.",
        add_member: "Add Member",
        edit_team: "Edit Team Details",
        search_placeholder: "Search name, title or email...",
        empty: "No team members found",
        user_detail: {
            edit_profile: "Edit Profile",
            no_phone: "No phone",
            member_since: "Member since",
            rating: "Rating",
            stats: {
                completed_tasks: "COMPLETED TASKS",
                active_projects: "ACTIVE PROJECTS",
                expenses_claimed: "EXPENSES CLAIMED"
            },
            tabs: {
                overview: "Overview",
                activity: "Activity Timeline"
            },
            employment: {
                title: "Employment Details",
                joined_date: "Joined Date",
                employee_id: "Employee ID"
            },
            activity: {
                title: "Activity Timeline",
                export_csv: "Export CSV"
            }
        },
        onboarding: {
            welcome: "Welcome to HipslothProject",
            subtitle: "To get started, please create your first team or workspace.",
            team_name: "Team Name",
            team_placeholder: "e.g. My Construction Co.",
            create_workspace: "Create Workspace",
            creating: "Creating...",
            main_workspace: "This will be your main workspace",
            hint: "You can create multiple teams later to separate different business units or branches."
        },
        confirm_remove: {
            title: "Remove Team Member?",
            message: "Are you sure you want to remove",
            warning: "This account will no longer be able to access the system."
        }
    },
    dialogs: {
        add_user: {
            title_add: "Add New Member",
            title_edit: "Edit Member",
            full_name: "Full Name",
            role: "Role",
            status: "Status",
            active: "Active",
            inactive: "Inactive",
            system_users_hint: "System Users: Can login and access the application. For field workers or external technicians, please use \"Partners\" instead.",
            cancel: "Cancel",
            save: "Save Changes",
            add: "Add Member"
        },
        add_partner: {
            title_add: "Add New Partner",
            title_edit: "Edit Partner",
            subtitle_add: "Add a new technician, contractor, or store.",
            subtitle_edit: "Update partner details",
            person: "Person",
            business: "Business",
            name_person: "Full Name",
            name_business: "Store / Company Name",
            role_skill: "Role / Skill",
            business_category: "Business Category",
            current_rating: "Current Rating",
            initial_rating: "Initial Rating",
            save: "Save Partner",
            update: "Update Partner",
            cancel: "Cancel"
        },
        invitations: {
            title: "Invite Members",
            tabs: {
                link: "Copy Link",
                email: "Send Email"
            },
            link_label: "Invite Link",
            copy: "Copy",
            copied: "Copied",
            or_share_code: "Or share code",
            org_id_label: "Organization ID (Code)",
            email_label: "Email Address",
            email_placeholder: "colleague@example.com",
            send_invite: "Send Invite",
            sent_via_mail: "Sent via Mail App",
            email_hint: "This will open your default email client with a pre-filled invitation.",
            success_placeholder: "Placeholder created for {email}",
        },
        join_org: {
            title: "Join Organization",
            subtitle: "Enter the invite code shared with you by your organization admin.",
            invite_code: "Invite Code",
            placeholder: "Paste invite code here",
            join_btn: "Join Organization",
            joining: "Joining...",
            back_to_create: "Back to Create",
            success_title: "Successfully Joined!",
            success_msg: "Welcome to the team. Redirecting you to the dashboard...",
            preview_title: "You are invited to join",
            members_count: "{count} members",
            sign_in_required: "Sign in to join this organization",
        },
        add_project: {
            title: "Quick Add Project",
            subtitle: "Create a new project quickly.",
            name: "Project Name",
            customer: "Customer Name",
            location: "Location",
            budget: "Estimated Budget",
            start_date: "Start Date",
            end_date: "End Date",
            save: "Save Project",
            placeholders: {
                name: "e.g. New House Renovation",
                customer: "e.g. Mr. Somchai",
                location: "e.g. Sukhumvit 101",
                budget: "e.g. 1000000"
            }
        }
    },
    contracts: {
        title: "Contracts",
        title_with_workers: "Contracts / Workers",
        subtitle: "Manage employment contracts and installment payments.",
        new_contract: "New Contract",
        total_value: "Total Value",
        print_preview: "Print / Preview",
        scope: "Scope of Work",
        installments: "Installments",
        due: "Due",
        note: "Note",
        pay_now: "Pay Now",
        confirm_payment: "Confirm payment of",
        confirm_hint: "This will create an expense record.",
        empty: "No contracts yet",
        empty_hint: "Create a contract to start tracking worker payments.",
        dialog: {
            title: "New Contract",
            subtitle: "Create a new employment contract.",
            edit_title: "Edit Contract",
            edit_subtitle: "Update contract details.",
            create_title: "Create Employment Contract",
            worker: "Worker / Contractor",
            project: "Project",
            title_field: "Contract Title",
            title_placeholder: "e.g. Electrical System Installation Phase 1",
            scope: "Scope of Work",
            scope_mode_items: "List Items",
            scope_mode_freeform: "Freeform",
            scope_placeholder_item: "Task description...",
            scope_placeholder_freeform: "Type full scope of work details...",
            add_item: "Add Item",
            total_amount: "Total Amount",
            start_date: "Start Date",
            end_date: "End Date",
            installments: "Payment Installments",
            add_installment: "Add Installment",
            installment_desc: "Description",
            installment_amount: "Amount",
            payment_details: "Payment Details (e.g. Transfer, Cash, Cheque...)",
            notes: "Notes",
            notes_placeholder: "Additional terms, special agreements, or other notes...",
            save: "Save Changes",
            create: "Create Contract",
            cancel: "Cancel"
        },
        document: {
            title: "Employment Contract",
            parties_title: "Contract Parties",
            employer: "Employer:",
            worker: "Worker/Contractor:",
            project: "Project:",
            duration: "Duration:",
            to: "to",
            tbd: "TBD",
            scope_title: "Scope of Work",
            schedule_title: "Payment Schedule",
            desc: "Description",
            due_date: "Due Date",
            amount: "Amount",
            total_value: "Total Contract Value:",
            notes_title: "Notes / Conditions:",
            sign_employer: "Employer",
            sign_worker: "Contractor / Worker"
        }
    },
    customers: {
        title: "Customers",
        subtitle: "Manage client relationships",
        add_customer: "Add Customer",
        search_placeholder: "Search by phone...",
        active: "Active",
        empty: "No customers found",
        dialog: {
            title: "Add New Customer",
            subtitle: "Enter customer details below.",
            name: "Customer Name",
            type: "Type",
            types: {
                individual: "Individual",
                company: "Company"
            },
            phone: "Phone Number",
            line_id: "Line ID",
            address: "Address",
            tax_id: "Tax ID",
            save: "Save Customer"
        }
    },
    login: {
        title: "Welcome Back",
        subtitle: "Sign in to access your HipslothProject dashboard",
        email: "Email",
        password: "Password",
        forgot_password: "Forgot password?",
        sign_in: "Sign in",
        or_continue: "Or continue with",
        sign_in_google: "Sign in with Google",
        secured_by: "Secured by HipslothProject",
        privacy_policy: "Privacy Policy",
        no_account: "Don't have an account?",
        sign_up: "Sign up",
        error_login_failed: "Login failed",
        error_invalid: "Invalid email or password."
    },
    register: {
        back_to_login: "Back to Login",
        title: "Create Account",
        subtitle: "Join HipslothProject and manage your projects efficiently",
        full_name: "Full Name",
        email: "Email",
        password: "Password",
        confirm_password: "Confirm Password",
        create_account: "Create Account",
        or_continue: "Or continue with",
        sign_up_google: "Sign up with Google",
        already_have: "Already have an account?",
        sign_in: "Sign in",
        error_mismatch: "Passwords do not match",
        error_length: "Password must be at least 6 characters",
        error_email_in_use: "Email is already in use",
        error_failed: "Registration failed. Please try again."
    },
    forgot_password: {
        back_to_login: "Back to Login",
        title: "Forgot password?",
        subtitle: "No worries, we'll send you reset instructions.",
        email: "Email",
        placeholder: "Enter your email",
        reset: "Reset Password",
        sending: "Sending...",
        check_email: "Check your email",
        sent_to: "We have sent a password reset link to",
        return_to_login: "Return to Login",
        didnt_receive: "Didn't receive the email?",
        resend: "Click to resend"
    },
    welcome_back: {
        greeting: "Welcome back,",
        fallback_name: "Friend",
        loading: "We're getting everything ready for you..."
    },
    onboarding: {
        loading: "Loading...",
        welcome: "Welcome,",
        get_started: "Let's get you started. How would you like to proceed?",
        continue_to: "Continue to",
        enter_workspace: "Enter your existing workspace",
        create_team: "Create a New Team",
        create_desc: "Set up your workspace from scratch",
        join_team: "Join an Existing Team",
        join_desc: "Enter an invite code or link",
        back: "Back",
        name_team: "Name your Team",
        company_question: "What's the name of your company or organization?",
        team_name: "Team Name",
        placeholder: "Acme Construction Co.",
        creating: "Creating...",
        create_workspace: "Create Workspace",
        join_title: "Join a Team",
        ask_admin: "Ask your team admin for an invite link or code.",
        have_link: "Have an invite link?",
        link_hint: "Clicking the link will automatically add you to the team.",
        enter_code: "Or enter a code manually",
        enter_invite: "Enter Invite Code",
        join: "Join Team"
    },
    invite: {
        login_required: "Please log in to join this team.",
        go_to_login: "Go to Login",
        verifying: "Verifying invite...",
        invalid: "Invalid Invite",
        invalid_desc: "This invite link is invalid or has expired.",
        back_home: "Back to Home",
        invited_to: "You've been invited to join",
        join_workspace: "Join Workspace",
        cancel: "Cancel"
    },
    privacy: {
        back_to_login: "Back to Login",
        title: "Privacy Policy",
        last_updated: "Last updated"
    },

    bored: {
        subtitle: "Collect your team members to grow!",
        best: "Best: {score}",
        score: "Score: {score}",
        leaderboard: "Leaderboard",
        no_scores: "No scores yet. Be the first!",
        instructions_title: "Instructions",
        instructions_desc: "Use arrow keys to navigate. Collect team members to grow your snake chain. Don't hit the walls (or yourself!)",
        staff_power_title: "Staff Power",
        staff_power_desc: "Each team member collected adds +10 to your team productivity score. Can you reach the top of the leaderboard?",
        game_over: "Game Over",
        final_score: "Final Score",
        try_again: "Try Again",
        start_game: "Start Game",
        move_instruction: "Use Arrow Keys to Move",
    },

    policy: {
        last_updated: "Last updated: January 28, 2026",
        data_privacy: {
            title: "Data Privacy",
            content: "At HipslothProject, we prioritize your data privacy. Since the application operates primarily as a Progressive Web App (PWA) with local-first capabilities, your operational data (expenses, tasks, documents) is stored securely on your device and via our encrypted cloud sync. We strictly adhere to global data protection standards to ensure your information remains confidential."
        },
        usage_policy: {
            title: "Usage Policy",
            content: "Users are responsible for the accuracy of the financial data and documents generated within the app. HipslothProject is a management tool tailored for construction and renovation teams. While we provide robust financial tracking, our software does not constitute official accounting or legal advice. Users should verify critical financial reports with a certified accountant."
        },
        security: {
            title: "Security Commitments",
            points: [
                "End-to-end encrypted data transmission between client and server using TLS 1.3.",
                "Regular automated daily backups for all organization data to prevent data loss.",
                "Robust Role-Based Access Control (RBAC) to ensure team members only access what they need.",
                "Optional PIN-code protection for mobile devices to prevent unauthorized physical access.",
                "strict data isolation policies ensuring your organization's data is never mixed with others."
            ]
        },
        footer: "For complete Terms of Service, Privacy Policy, or specific legal inquiries, please contact our legal team at support@hipsloth.app."
    },

    about: {
        tagline: "HipslothProject - The ultimate companion for modern construction teams.",
        version: "Version",
        mission_title: "Our Mission",
        mission_desc: "To simplify project management for construction and renovation teams by providing powerful tools for tracking financials, managing tasks, and collaborating with clients, all in one intuitive interface.",
        support_title: "Support & Contact",
        email_support: "Email Support",
        official_website: "Official Website",
        rights_reserved: "© 2026 HipslothProject. All rights reserved."
    }
}
