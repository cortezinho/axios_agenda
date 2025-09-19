import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';

const API_BASE_URL = "http://10.110.12.47:9000/appointments";

// 🔹 Botão customizado com efeito vidro fosco e arredondado
function CustomButton({ title, onPress, color = 'rgba(255,255,255,0.2)' }) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState('pendente');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Buscar todos os compromissos
  const fetchAppointments = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setAppointments(response.data);
    } catch (error) {
      console.error("Erro ao buscar compromissos:", error.message);
    }
  };

  // Criar um novo compromisso
  const createAppointment = async () => {
    try {
      const appointmentData = {
        title: title,
        notes: notes,
        date: date.toISOString().split('T')[0],
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status
      };

      await axios.post(API_BASE_URL, appointmentData);
      resetForm();
      setModalVisible(false);
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao criar compromisso:", error.message);
    }
  };

  // Atualizar um compromisso existente
  const updateAppointment = async () => {
    try {
      const appointmentData = {
        title: title,
        notes: notes,
        date: date.toISOString().split('T')[0],
        time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status
      };

      await axios.put(`${API_BASE_URL}/${editingAppointment.id}`, appointmentData);
      resetForm();
      setModalVisible(false);
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao atualizar compromisso:", error.message);
    }
  };

  // Excluir um compromisso
  const deleteAppointment = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      fetchAppointments();
    } catch (error) {
      console.error("Erro ao excluir compromisso:", error.message);
    }
  };

  // Limpar o formulário
  const resetForm = () => {
    setTitle('');
    setNotes('');
    setDate(new Date());
    setTime(new Date());
    setStatus('pendente');
    setEditingAppointment(null);
  };

  // Abrir modal para edição
  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setTitle(appointment.title);
    setNotes(appointment.notes);
    setDate(new Date(appointment.date));
    setTime(new Date(`2000-01-01T${appointment.time}`));
    setStatus(appointment.status);
    setModalVisible(true);
  };

  // Fechar modal e limpar formulário
  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  // Obter cor baseada no status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return '#FFA500';
      case 'agendado': return '#1E90FF';
      case 'concluído': return '#32CD32';
      default: return '#666';
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Agenda de Compromissos</Text>
      
      <CustomButton title="Novo Compromisso" color="rgb(43, 255, 0)" onPress={() => setModalVisible(true)} />
      
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.appointmentItem}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTitle}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            
            <Text style={styles.appointmentNotes}>{item.notes}</Text>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.detailText}>Data: {formatDate(item.date)}</Text>
              <Text style={styles.detailText}>Hora: {item.time}</Text>
            </View>
            
            <View style={styles.appointmentActions}>
              <CustomButton title="Editar" color="rgba(234, 255, 0, 0.84)" onPress={() => openEditModal(item)} />
              <CustomButton title="Excluir" color="rgba(255,69,0,0.6)" onPress={() => deleteAppointment(item.id)} />
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {editingAppointment ? 'Editar Compromisso' : 'Novo Compromisso'}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Título do compromisso"
            placeholderTextColor="#ccc"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Anotações"
            placeholderTextColor="#ccc"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Data:</Text>
            <CustomButton 
              title={date.toLocaleDateString('pt-BR')} 
              onPress={() => setShowDatePicker(true)} 
            />
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Hora:</Text>
            <CustomButton 
              title={time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
              onPress={() => setShowTimePicker(true)} 
            />
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) setTime(selectedTime);
                }}
              />
            )}
          </View>
          
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Status:</Text>
            <Picker
              selectedValue={status}
              onValueChange={(itemValue) => setStatus(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Pendente" value="pendente" />
              <Picker.Item label="Agendado" value="agendado" />
              <Picker.Item label="Concluído" value="concluído" />
            </Picker>
          </View>
          
          <View style={styles.modalButtons}>
            <CustomButton color="rgb(51, 255, 0)"
              title={editingAppointment ? "Atualizar" : "Criar"}
              onPress={editingAppointment ? updateAppointment : createAppointment}
            />
            <CustomButton title="Cancelar" color="rgb(255, 0, 0)" onPress={closeModal} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1E3A8A', // Azul escuro de fundo
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: 'white',
  },
  list: {
    marginTop: 20,
  },
  appointmentItem: {
    backgroundColor: 'rgba(4, 0, 255, 0.82)', // Vidro fosco
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appointmentNotes: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 10,
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0, 64, 255, 0.78)', // efeito fosco no modal
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
    color: 'white',
  },
  picker: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: 'white',
  },
  modalButtons: {
    marginTop: 20,
    gap: 10,
  },
  // 🔹 Estilos para os botões customizados
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // arredondado
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
