import { Tarea } from './tarea';

describe('Tarea (dominio)', () => {
  describe('crear', () => {
    it('debe crear una tarea con estado inicial pendiente y fecha de creación', () => {
      // Arrange
      const antesDeCrear = new Date();
      // Act
      const tarea = Tarea.crear('Estudar NestJS', 'Capítulo 1');
      // Assert
      expect(tarea.id).toBeUndefined();
      expect(tarea.titulo).toBe('Estudar NestJS');
      expect(tarea.descripcion).toBe('Capítulo 1');
      expect(tarea.estado).toBe('pendiente');
      expect(tarea.creadaEn!.getTime()).toBeGreaterThanOrEqual(antesDeCrear.getTime());
    });

    it('debe permitir crear una tarea sin descripción', () => {
      const tarea = Tarea.crear('Sin descripción');
      expect(tarea.descripcion).toBeNull();
    });

    it('debe lanzar un error cuando el título está ausente', () => {
      expect(() => Tarea.crear('')).toThrow('El título es obligatorio');
    });

    it('debe lanzar un error cuando el título solo tiene espacios', () => {
      expect(() => Tarea.crear('   ')).toThrow('El título es obligatorio');
    });
  });

  describe('actualizar', () => {
    const tarea = Tarea.reconstruir(
      1,
      'Original',
      'desc',
      'pendiente',
      new Date(),
    );

    it('debe aplicar los cambios y conservar los campos no indicados', () => {
      const actualizada = tarea.actualizar({ estado: 'completada' });
      expect(actualizada.estado).toBe('completada');
      expect(actualizada.titulo).toBe('Original');
      expect(actualizada.descripcion).toBe('desc');
      expect(actualizada.id).toBe(1);
    });

    it('debe conservar la fecha de creación original', () => {
      const actualizada = tarea.actualizar({ titulo: 'Nuevo' });
      expect(actualizada.creadaEn).toBe(tarea.creadaEn);
    });

    it('debe lanzar un error al actualizar a un estado inválido', () => {
      expect(() => tarea.actualizar({ estado: 'archivada' as never })).toThrow(
        'Estado inválido',
      );
    });

    it('debe lanzar un error al actualizar el título a vacío', () => {
      expect(() => tarea.actualizar({ titulo: '' })).toThrow(
        'El título es obligatorio',
      );
    });

    it('debe no mutar la instancia original', () => {
      tarea.actualizar({ titulo: 'Otro' });
      expect(tarea.titulo).toBe('Original');
    });
  });

  describe('reconstruir', () => {
    it('debe rechazar un estado inválido en la reconstrucción', () => {
      expect(() =>
        Tarea.reconstruir(1, 'T', null, 'bogus', new Date()),
      ).toThrow('Estado inválido');
    });

    it('debe aceptar los estados válidos', () => {
      expect(
        Tarea.reconstruir(1, 'T', null, 'pendiente', new Date()).estado,
      ).toBe('pendiente');
      expect(
        Tarea.reconstruir(2, 'T', null, 'completada', new Date()).estado,
      ).toBe('completada');
    });
  });
});
