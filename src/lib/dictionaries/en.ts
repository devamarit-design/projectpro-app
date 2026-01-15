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
    navbar: {
        home: "Home",
        finance: "Finance",
        more: "More",
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
                files: "Files"
            },
            overview: {
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
        unpaid: "Unpaid",
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
            task: "Task / Sub-project",
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
            theme: "App Theme"
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
            warning_days: "Advance Warning (Days)",
            warning_desc: "How many days in advance should we alert you about due dates?",
            overdue: "Overdue Alerts",
            overdue_desc: "Get notified immediately when items are overdue.",
            assignments: "Task Assignments",
            assignments_desc: "Get notified when you are assigned to a new task."
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
        onboarding: {
            welcome: "Welcome to ProjectPro",
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
            update: "Update Partner"
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
    }
}
